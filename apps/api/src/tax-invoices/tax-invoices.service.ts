import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ZatcaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { ZatcaClientService } from './zatca-client.service';

@Injectable()
export class TaxInvoicesService {
  private readonly logger = new Logger(TaxInvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zatcaClient: ZatcaClientService,
  ) {}

  // تُستدعى تلقائياً فور تأكيد دفع أي طلب — تُنشئ الفاتورة الضريبية إن لم تكن
  // موجودة مسبقاً (idempotent)، ثم تحاول إرسالها لزاتكا فوراً (نفس التزام
  // "الإبلاغ خلال 24 ساعة" في نظام الفوترة الإلكترونية الفعلي).
  async createForPaidOrder(orderId: string) {
    const existing = await this.prisma.taxInvoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    const total = Number(order.total);
    const vatAmount = order.vatAmount !== null ? Number(order.vatAmount) : 0;
    const subtotal = Math.round((total - vatAmount) * 100) / 100;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const settings = await tx.platformSettings.upsert({
        where: { id: 'default' },
        update: { nextInvoiceIcv: { increment: 1 } },
        create: { id: 'default', nextInvoiceIcv: 2 },
        select: { nextInvoiceIcv: true },
      });
      // بعد upsert الإدمن settings.nextInvoiceIcv صار "القادم" — رقم هذه الفاتورة هو القيمة قبل الزيادة
      const icv = settings.nextInvoiceIcv - 1;

      const previous = await tx.taxInvoice.findFirst({
        orderBy: { icv: 'desc' },
        select: { invoiceHash: true },
      });

      return tx.taxInvoice.create({
        data: {
          invoiceNo: `INV-${icv.toString().padStart(6, '0')}`,
          icv,
          orderId: order.id,
          storeId: order.storeId,
          subtotal,
          vatAmount,
          total,
          previousInvoiceHash: previous?.invoiceHash ?? null,
        },
      });
    });

    // محاولة إرسال أولى فورية — لا توقف إنشاء الفاتورة لو فشلت (تبقى قابلة لإعادة الإرسال يدوياً)
    try {
      return await this.submit(invoice.id);
    } catch (e) {
      this.logger.warn(`فشلت المحاولة التلقائية الأولى لإرسال الفاتورة ${invoice.invoiceNo}: ${e}`);
      return invoice;
    }
  }

  // فواتير التاجر الخاصة بمحله فقط — بيانات الفاتورة التجارية البحتة (رقمها،
  // تاريخها، طلبها، مبالغها)، بدون أي تفصيل عن حالة الإرسال لزاتكا (مقبولة/
  // فشل/عدد المحاولات...) — هذا شأن داخلي بين المنصة وزاتكا، لا يعني التاجر
  async listForMerchant(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const invoices = await this.prisma.taxInvoice.findMany({
      where: { storeId: store.id },
      orderBy: { icv: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            paidAt: true,
            consumer: { select: { name: true, phone: true } },
          },
        },
      },
    });
    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      subtotal: inv.subtotal,
      vatAmount: inv.vatAmount,
      total: inv.total,
      createdAt: inv.createdAt,
      order: inv.order,
    }));
  }

  listForAdmin(status?: ZatcaStatus) {
    return this.prisma.taxInvoice.findMany({
      where: status ? { status } : undefined,
      orderBy: { icv: 'desc' },
      include: {
        store: { select: { name: true } },
        order: {
          select: {
            id: true,
            paidAt: true,
            consumer: { select: { name: true, phone: true } },
          },
        },
      },
    });
  }

  async getOneForAdmin(id: string) {
    const invoice = await this.prisma.taxInvoice.findUnique({
      where: { id },
      include: {
        store: { select: { name: true, taxNo: true, commercialRegisterNo: true } },
        order: {
          include: {
            items: { include: { product: true } },
            consumer: { select: { name: true, phone: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    return invoice;
  }

  // إعادة إرسال يدوية من الأدمن — نفس منطق الإرسال التلقائي الأول بالضبط
  async resend(id: string) {
    const invoice = await this.prisma.taxInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    return this.submit(id);
  }

  private async submit(invoiceId: string) {
    const invoice = await this.prisma.taxInvoice.findUnique({
      where: { id: invoiceId },
      include: { store: { select: { name: true } } },
    });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');

    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });

    const result = await this.zatcaClient.submit({
      invoiceNo: invoice.invoiceNo,
      icv: invoice.icv,
      previousInvoiceHash: invoice.previousInvoiceHash,
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      total: Number(invoice.total),
      storeName: invoice.store.name,
      settings,
    });

    const status: ZatcaStatus = result.status === 'rejected' ? 'failed' : result.status;

    return this.prisma.taxInvoice.update({
      where: { id: invoiceId },
      data: {
        status,
        invoiceHash: result.invoiceHash,
        zatcaUuid: result.uuid || null,
        zatcaQrData: result.qrData,
        lastError: result.status === 'rejected' ? result.message : null,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        submittedAt: status === 'accepted' || status === 'accepted_with_warnings' ? new Date() : invoice.submittedAt,
      },
    });
  }
}

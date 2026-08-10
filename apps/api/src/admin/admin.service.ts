import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  listStores(status?: StoreStatus) {
    return this.prisma.store.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
      },
    });
  }

  async approveStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id }, include: { owner: true } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن قبول طلب ليس قيد المراجعة');
    }
    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: 'active', rejectionReason: null },
    });
    if (store.owner.email) {
      this.mail.sendStoreApproval(store.owner.email, store.name).catch(() => undefined);
    }
    return updated;
  }

  async rejectStore(id: string, reason: string) {
    const store = await this.prisma.store.findUnique({ where: { id }, include: { owner: true } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن رفض طلب ليس قيد المراجعة');
    }
    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
    });
    // حسب قاعدة العمل المحسومة: عند الرفض يُرسل بريد بالسبب للتاجر
    if (store.owner.email) {
      this.mail.sendStoreRejection(store.owner.email, store.name, reason).catch(() => undefined);
    }
    return updated;
  }

  async suspendStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'active') {
      throw new BadRequestException('لا يمكن إيقاف محل ليس نشطاً');
    }
    return this.prisma.store.update({ where: { id }, data: { status: 'suspended' } });
  }

  async reactivateStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'suspended') {
      throw new BadRequestException('لا يمكن إعادة تفعيل محل ليس موقوفاً');
    }
    return this.prisma.store.update({ where: { id }, data: { status: 'active' } });
  }

  // تأكيد/إلغاء تأكيد استلام دفع فاتورة الاشتراك يدوياً من الإدمن
  // (بديل مؤقت لحد ربط بوابة دفع فعلية — مطابق لملاحظة "الدفع يُحدَّد لاحقاً" في المواصفات)
  async setSubscriptionPaid(subscriptionId: string, paid: boolean) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new NotFoundException('الاشتراك غير موجود');
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { paidAt: paid ? new Date() : null },
    });
  }
}

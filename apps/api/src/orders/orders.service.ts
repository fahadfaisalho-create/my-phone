import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { assertStoreAvailable } from '../common/store-availability.util';
import { distanceKm } from '../common/geo.util';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  async create(consumerId: string, dto: CreateOrderDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 }, branches: true },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');
    assertStoreAvailable(store.status, store.subscriptions[0] ?? null);

    // لو المحل عنده أكثر من فرع، لازم يحدد المستهلك أي فرع يتسوق منه
    if (store.branches.length > 1) {
      if (!dto.branchId) {
        throw new BadRequestException('اختر الفرع الذي تتسوق منه قبل إتمام الطلب');
      }
      if (!store.branches.some((b) => b.id === dto.branchId)) {
        throw new BadRequestException('الفرع المختار لا ينتمي لهذا المحل');
      }
    } else if (dto.branchId && !store.branches.some((b) => b.id === dto.branchId)) {
      throw new BadRequestException('الفرع المختار لا ينتمي لهذا المحل');
    }
    // فرع واحد فقط: نستخدمه تلقائياً حتى لو المستهلك ما أرسل اختياراً صريحاً
    const branchId = dto.branchId ?? (store.branches.length === 1 ? store.branches[0].id : null);

    const deliveryType = dto.deliveryType ?? 'pickup';
    // طريقة التوصيل: شركة شحن خارجية (افتراضي) أو مندوب المحل نفسه ضمن نطاقه الجغرافي
    const deliveryMethod = deliveryType === 'delivery' ? dto.deliveryMethod ?? 'courier' : null;
    let agentFee: number | null = null;

    if (deliveryType === 'delivery') {
      if (deliveryMethod === 'store_agent') {
        if (!store.supportsAgentDelivery) {
          throw new BadRequestException('هذا المحل لا يدعم التوصيل بمناديبه الخاصين');
        }
        if (dto.deliveryLat === undefined || dto.deliveryLng === undefined) {
          throw new BadRequestException('حدد موقعك للتحقق من أهليتك لتوصيل مناديب المحل');
        }
        if (store.agentZoneLat === null || store.agentZoneLng === null || store.agentZoneRadiusKm === null) {
          throw new BadRequestException('المحل لم يحدد نطاق التوصيل بعد');
        }
        const distance = distanceKm(dto.deliveryLat, dto.deliveryLng, store.agentZoneLat, store.agentZoneLng);
        if (distance > store.agentZoneRadiusKm) {
          throw new BadRequestException('موقعك خارج نطاق توصيل هذا المحل — جرّب طريقة استلام أخرى');
        }
        agentFee = Number(store.agentDeliveryFee ?? 0);
      } else {
        if (!store.supportsDelivery) {
          throw new BadRequestException('هذا المحل لا يدعم خدمة التوصيل عبر شركة شحن');
        }
        if (!dto.deliveryAddress?.trim()) {
          throw new BadRequestException('عنوان التوصيل مطلوب عند اختيار التوصيل');
        }
        if (!dto.courierProvider) {
          throw new BadRequestException('اختر شركة الشحن عند طلب التوصيل');
        }
      }
    }

    // نسخة رسوم التوصيل وقت الطلب — لا تتأثر لو التاجر غيّر الرسوم لاحقاً
    const deliveryFee =
      deliveryType === 'delivery'
        ? deliveryMethod === 'store_agent'
          ? agentFee
          : Number(store.deliveryFee ?? 0)
        : null;

    return this.prisma.$transaction(
      async (tx) => {
        let subtotal = 0;
        const itemsData: { productId: string; qty: number; price: number }[] = [];

        for (const item of dto.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.storeId !== store.id) {
            throw new BadRequestException(`المنتج ${item.productId} لا ينتمي لهذا المحل`);
          }
          // منتج مرتبط بفرع محدد لا يُشترى إلا من نفس الفرع الذي اختاره المستهلك
          if (product.branchId && product.branchId !== branchId) {
            throw new BadRequestException(`"${product.name}" غير متاح في الفرع الذي اخترته`);
          }
          if (product.quantity < item.qty) {
            throw new BadRequestException(`الكمية المتوفرة من "${product.name}" غير كافية`);
          }
          const price = Number(product.price);
          subtotal += price * item.qty;
          itemsData.push({ productId: product.id, qty: item.qty, price });
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: item.qty } },
          });
        }

        // كوبون الخصم (اختياري) — يُطبّق على إجمالي المنتجات فقط، لا على رسوم التوصيل
        let couponId: string | null = null;
        let discountAmount: number | null = null;
        if (dto.couponCode) {
          const resolved = await this.couponsService.resolveCoupon(dto.couponCode, {
            storeId: store.id,
            scope: 'orders',
            amount: subtotal,
          });
          couponId = resolved.coupon.id;
          discountAmount = resolved.discountAmount;
          await this.couponsService.redeem(tx, resolved.coupon.id);
        }

        const total = subtotal - (discountAmount ?? 0) + (deliveryFee ?? 0);

        return tx.order.create({
          data: {
            consumerId,
            storeId: store.id,
            total,
            status: 'pending',
            paymentStatus: 'unpaid',
            deliveryType,
            deliveryAddress: deliveryType === 'delivery' ? dto.deliveryAddress?.trim() ?? null : null,
            deliveryLat: deliveryType === 'delivery' ? dto.deliveryLat ?? null : null,
            deliveryLng: deliveryType === 'delivery' ? dto.deliveryLng ?? null : null,
            deliveryFee,
            courierProvider: deliveryMethod === 'courier' ? dto.courierProvider ?? null : null,
            deliveryMethod,
            branchId,
            couponId,
            discountAmount,
            items: { create: itemsData },
          },
          include: { items: true },
        });
      },
      // مهلة أطول من الافتراضي (5 ثوان) — الحلقة على المنتجات + التحقق من الكوبون
      // قد تحتاج عدة رحلات لقاعدة بيانات Neon السحابية، خصوصاً بعد فترة خمول
      { timeout: 15000 },
    );
  }

  // المستهلك يقدر يلغي طلبه بنفسه طالما لسه قيد الانتظار وغير مدفوع (لم يبدأ المحل تجهيزه بعد)
  // — تُعاد الكمية المخصومة من المخزون تلقائياً ضمن نفس المعاملة
  async cancelMine(consumerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.consumerId !== consumerId) {
      throw new NotFoundException('الطلب غير موجود');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('لا يمكن إلغاء طلب بدأ تجهيزه أو تم إنهاؤه بالفعل');
    }
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('الطلب مدفوع بالفعل — تواصل مع الدعم لإلغائه واسترجاع المبلغ');
    }
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.qty } },
        });
      }
      return tx.order.update({ where: { id: orderId }, data: { status: 'cancelled' } });
    });
  }

  listMine(consumerId: string) {
    return this.prisma.order.findMany({
      where: { consumerId },
      orderBy: { id: 'desc' },
      include: {
        items: { include: { product: true } },
        store: { select: { name: true } },
        coupon: { select: { code: true } },
      },
    });
  }

  async listForMyStore(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { id: 'desc' },
      include: {
        items: { include: { product: true } },
        consumer: { select: { name: true, phone: true } },
        branch: { select: { id: true, name: true } },
        coupon: { select: { code: true } },
      },
    });
  }

  // محاكاة دفع فوري من المستهلك نفسه — بوابة الدفع الفعلية غير مربوطة بعد
  // (منظر بواجهة المستخدم فقط؛ الإدمن يقدر أيضاً يؤكد/يلغي التأكيد يدوياً كخيار احتياطي)
  async confirmPaymentAsConsumer(consumerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.consumerId !== consumerId) {
      throw new NotFoundException('الطلب غير موجود');
    }
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('تم دفع هذا الطلب مسبقاً');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid', paidAt: new Date() },
    });
  }

  async updateStatus(ownerUserId: string, orderId: string, status: OrderStatus) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) {
      throw new NotFoundException('الطلب غير موجود');
    }
    return this.prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  // --- الإدمن: بوابة الدفع الفعلية غير مربوطة بعد، فالإدمن يؤكد استلام دفع الطلب يدوياً
  // (بنفس نمط تأكيد دفع اشتراك المحل) ---
  listAllForAdmin(paymentStatus?: 'unpaid' | 'paid' | 'refunded') {
    return this.prisma.order.findMany({
      where: paymentStatus ? { paymentStatus } : undefined,
      orderBy: { id: 'desc' },
      include: {
        items: { include: { product: true } },
        consumer: { select: { name: true, phone: true } },
        store: { select: { name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async setPaymentStatusAsAdmin(orderId: string, paid: boolean) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: paid ? 'paid' : 'unpaid', paidAt: paid ? new Date() : null },
    });
  }

  // --- الفاتورة: لا تصدر أبداً قبل اكتمال الدفع فعلياً — التحقق هنا بالباك إند
  // مو مجرد إخفاء بالواجهة، حتى لو حاول أحد الوصول للرابط مباشرة ---
  private async buildInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        consumer: { select: { name: true, phone: true } },
        store: { select: { name: true, taxNo: true, commercialRegisterNo: true } },
      },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (order.paymentStatus !== 'paid' || !order.paidAt) {
      throw new BadRequestException('الفاتورة تصدر فقط بعد اكتمال الدفع');
    }
    const subtotal = order.items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
    const total = Number(order.total);

    // فاتورة ضريبية مبسطة (متوافقة مع نمط زاتكا) فقط للمتاجر المسجّلة بضريبة القيمة
    // المضافة (عندها رقم ضريبي) — بدون رقم ضريبي تصدر "فاتورة مبسطة" بدون تفصيل ضريبي،
    // لأنه لا يحق قانونياً إظهار ضريبة بدون تسجيل. الأسعار المعروضة تُعامل كشاملة للضريبة
    // (نمط التجزئة المعتاد بالسعودية) فتُستخرج الضريبة من الإجمالي بدل إضافتها عليه.
    const vatRate = order.store.taxNo ? 15 : null;
    const taxableAmount = vatRate ? Math.round((total / 1.15) * 100) / 100 : null;
    const vatAmount = vatRate && taxableAmount !== null ? Math.round((total - taxableAmount) * 100) / 100 : null;

    return {
      invoiceNo: `INV-${order.id.slice(-8).toUpperCase()}`,
      issuedAt: order.paidAt,
      createdAt: order.createdAt,
      store: {
        name: order.store.name,
        taxNo: order.store.taxNo,
        commercialRegisterNo: order.store.commercialRegisterNo,
      },
      consumer: order.consumer,
      items: order.items.map((i) => ({
        name: i.product.name,
        qty: i.qty,
        price: Number(i.price),
        lineTotal: Number(i.price) * i.qty,
      })),
      subtotal,
      deliveryType: order.deliveryType,
      deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : null,
      courierProvider: order.courierProvider,
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
      total,
      vatRate,
      taxableAmount,
      vatAmount,
      // باركود الفاتورة الإلكترونية (زاتكا) — يبقى فارغاً لحد ربط منظومة الفوترة الفعلية
      zatcaQrData: null as string | null,
    };
  }

  async getInvoiceForConsumer(consumerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.consumerId !== consumerId) throw new NotFoundException('الطلب غير موجود');
    return this.buildInvoice(orderId);
  }

  async getInvoiceForMerchant(ownerUserId: string, orderId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) throw new NotFoundException('الطلب غير موجود');
    return this.buildInvoice(orderId);
  }
}

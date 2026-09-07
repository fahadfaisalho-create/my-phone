import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/file-storage.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApplySubscriptionCouponDto } from './dto/apply-subscription-coupon.dto';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CouponsService } from '../coupons/coupons.service';

export interface UpdateStoreFiles {
  logo?: Express.Multer.File[];
  crFile?: Express.Multer.File[];
  bankFile?: Express.Multer.File[];
}

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly fileStorage: FileStorageService,
  ) {}

  // userId قد يكون صاحب المحل نفسه أو حساباً فرعياً (employee) تابعاً له —
  // نفس منطق getOwnedStoreOrThrow بالضبط، لكن بإرجاع الاشتراك أيضاً (تحتاجه
  // كل الواجهة: بانر الفاتورة غير المدفوعة يظهر حتى للموظف عند فتح اللوحة)
  async findMine(userId: string) {
    const ownedStore = await this.prisma.store.findFirst({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (ownedStore) return ownedStore;

    const employeeProfile = await this.prisma.employeeProfile.findUnique({ where: { userId } });
    if (employeeProfile && employeeProfile.active) {
      const store = await this.prisma.store.findUnique({
        where: { id: employeeProfile.storeId },
        include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
      });
      if (store) return store;
    }

    throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
  }

  // تعديل بيانات المحل. إذا كان مرفوضاً سابقاً، تُعاد الحالة إلى "قيد المراجعة" تلقائياً
  // (حسب القاعدة: التاجر يعدّل ويعيد الإرسال دون بدء حساب جديد)
  async updateMine(ownerUserId: string, dto: UpdateStoreDto, files: UpdateStoreFiles) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);

    const logo = files.logo?.[0];
    const crFile = files.crFile?.[0];
    const bankFile = files.bankFile?.[0];
    const wasRejected = store.status === 'rejected';

    const supportsAgentDelivery = dto.supportsAgentDelivery ?? store.supportsAgentDelivery;
    const agentZoneLat = dto.agentZoneLat ?? store.agentZoneLat ?? undefined;
    const agentZoneLng = dto.agentZoneLng ?? store.agentZoneLng ?? undefined;
    const agentZoneRadiusKm = dto.agentZoneRadiusKm ?? store.agentZoneRadiusKm ?? undefined;
    const agentDeliveryFee = dto.agentDeliveryFee ?? store.agentDeliveryFee ?? undefined;
    if (
      supportsAgentDelivery &&
      (agentZoneLat === undefined ||
        agentZoneLng === undefined ||
        agentZoneRadiusKm === undefined ||
        agentDeliveryFee === undefined)
    ) {
      throw new BadRequestException(
        'لتفعيل توصيل مناديب المحل، حدد نطاق التغطية على الخريطة ونصف القطر والسعر',
      );
    }

    const logoUrl = logo ? await this.fileStorage.upload(logo, 'logos') : store.logoUrl;
    const crFileUrl = crFile ? await this.fileStorage.upload(crFile, 'cr') : store.crFileUrl;
    const bankCertificateFileUrl = bankFile
      ? await this.fileStorage.upload(bankFile, 'bank')
      : store.bankCertificateFileUrl;

    return this.prisma.store.update({
      where: { id: store.id },
      data: {
        name: dto.storeName ?? store.name,
        commercialRegisterNo: dto.commercialRegisterNo ?? store.commercialRegisterNo,
        nationalId: dto.nationalId ?? store.nationalId,
        taxNo: dto.taxNo ?? store.taxNo,
        iban: dto.iban ?? store.iban,
        logoUrl,
        crFileUrl,
        bankCertificateFileUrl,
        supportsDelivery: dto.supportsDelivery ?? store.supportsDelivery,
        deliveryFee:
          dto.supportsDelivery === false ? null : dto.deliveryFee ?? store.deliveryFee,
        supportsAgentDelivery,
        agentZoneLat: supportsAgentDelivery ? agentZoneLat : null,
        agentZoneLng: supportsAgentDelivery ? agentZoneLng : null,
        agentZoneRadiusKm: supportsAgentDelivery ? agentZoneRadiusKm : null,
        agentDeliveryFee: supportsAgentDelivery ? agentDeliveryFee : null,
        ...(wasRejected ? { status: 'pending', rejectionReason: null } : {}),
      },
    });
  }

  // محاكاة دفع فوري لاشتراك المحل من التاجر نفسه — بوابة الدفع الفعلية غير مربوطة بعد
  // (منظر بواجهة المستخدم فقط؛ الإدمن يقدر أيضاً يؤكد/يلغي التأكيد يدوياً كخيار احتياطي)
  async confirmSubscriptionPayment(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const subscription = await this.prisma.subscription.findFirst({
      where: { storeId: store.id },
      orderBy: { startDate: 'desc' },
    });
    if (!subscription) throw new NotFoundException('لا يوجد اشتراك لهذا المحل');
    if (subscription.paidAt) throw new BadRequestException('تم دفع الاشتراك مسبقاً');
    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { paidAt: new Date() },
    });
  }

  // تطبيق كوبون خصم على اشتراك المحل الحالي — لمن ما استخدم كود عند التسجيل
  // أو حصل على كود لاحقاً. لا يعمل إلا قبل الدفع، ومرة واحدة فقط لكل اشتراك
  async applySubscriptionCoupon(ownerUserId: string, dto: ApplySubscriptionCouponDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const subscription = await this.prisma.subscription.findFirst({
      where: { storeId: store.id },
      orderBy: { startDate: 'desc' },
    });
    if (!subscription) throw new NotFoundException('لا يوجد اشتراك لهذا المحل');
    if (subscription.paidAt) throw new BadRequestException('تم دفع الاشتراك مسبقاً، لا يمكن تطبيق كوبون عليه');
    if (subscription.couponId) throw new BadRequestException('تم تطبيق كوبون على هذا الاشتراك مسبقاً');

    return this.prisma.$transaction(
      async (tx) => {
        // الكوبون يُطبّق على السعر قبل الضريبة، وتُعاد حساب الضريبة (15%) بعده — price
        // النهائي يبقى شامل الضريبة، بنفس نمط الحساب وقت التسجيل
        const taxableBefore = Number(subscription.price) - Number(subscription.vatAmount ?? 0);
        const { coupon, discountAmount } = await this.couponsService.resolveCoupon(dto.couponCode, {
          storeId: store.id,
          scope: 'subscriptions',
          amount: taxableBefore,
        });
        await this.couponsService.redeem(tx, coupon.id);
        const taxableAfter = taxableBefore - discountAmount;
        const vatAmount = Math.round(taxableAfter * 0.15 * 100) / 100;
        return tx.subscription.update({
          where: { id: subscription.id },
          data: {
            price: taxableAfter + vatAmount,
            couponId: coupon.id,
            discountAmount,
            vatAmount,
          },
        });
      },
      { timeout: 15000 },
    );
  }

  // إحصائيات لوحة التاجر: أعداد (فروع/خدمات/منتجات/محادثات/حجوزات/طلبات) +
  // إيراد فعلي (طلبات مدفوعة فقط) — إجمالي، هذا الشهر، وآخر 6 أشهر لرسم بياني
  // بسيط. نفس منطق admin.service.getStats بالضبط لكن مقصور على محل واحد.
  async getStats(userId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, userId);
    const [branches, services, products, chats, bookings, paidOrders, ordersCount] = await Promise.all([
      this.prisma.branch.count({ where: { storeId: store.id } }),
      this.prisma.service.count({ where: { storeId: store.id } }),
      this.prisma.product.count({ where: { storeId: store.id } }),
      this.prisma.chat.count({ where: { storeId: store.id } }),
      this.prisma.booking.count({ where: { storeId: store.id } }),
      this.prisma.order.findMany({
        where: { storeId: store.id, paymentStatus: 'paid' },
        select: { total: true, paidAt: true },
      }),
      this.prisma.order.count({ where: { storeId: store.id } }),
    ]);

    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleDateString('ar-SA', { month: 'long' }) });
    }
    const revenueByMonth = new Map(months.map((m) => [m.key, 0]));
    let totalRevenue = 0;
    for (const o of paidOrders) {
      if (!o.paidAt) continue;
      totalRevenue += Number(o.total);
      const bucket = revenueByMonth.get(monthKey(o.paidAt));
      if (bucket !== undefined) revenueByMonth.set(monthKey(o.paidAt), bucket + Number(o.total));
    }
    const thisMonthKey = monthKey(now);

    return {
      branches,
      services,
      products,
      chats,
      bookings,
      orders: ordersCount,
      revenue: {
        total: totalRevenue,
        thisMonth: revenueByMonth.get(thisMonthKey) ?? 0,
        paidOrdersCount: paidOrders.length,
        monthly: months.map((m) => ({ month: m.label, total: revenueByMonth.get(m.key)! })),
      },
    };
  }
}

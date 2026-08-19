import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  async findMine(ownerUserId: string) {
    const store = await this.prisma.store.findFirst({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (!store) throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
    return store;
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

    return this.prisma.store.update({
      where: { id: store.id },
      data: {
        name: dto.storeName ?? store.name,
        commercialRegisterNo: dto.commercialRegisterNo ?? store.commercialRegisterNo,
        nationalId: dto.nationalId ?? store.nationalId,
        taxNo: dto.taxNo ?? store.taxNo,
        iban: dto.iban ?? store.iban,
        logoUrl: logo ? `/uploads/logos/${logo.filename}` : store.logoUrl,
        crFileUrl: crFile ? `/uploads/cr/${crFile.filename}` : store.crFileUrl,
        bankCertificateFileUrl: bankFile
          ? `/uploads/bank/${bankFile.filename}`
          : store.bankCertificateFileUrl,
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
        const { coupon, discountAmount } = await this.couponsService.resolveCoupon(dto.couponCode, {
          storeId: store.id,
          scope: 'subscriptions',
          amount: Number(subscription.price),
        });
        await this.couponsService.redeem(tx, coupon.id);
        return tx.subscription.update({
          where: { id: subscription.id },
          data: {
            price: Number(subscription.price) - discountAmount,
            couponId: coupon.id,
            discountAmount,
          },
        });
      },
      { timeout: 15000 },
    );
  }
}

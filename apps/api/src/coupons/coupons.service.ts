import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon, CouponScope, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateCouponAdminDto } from './dto/create-coupon-admin.dto';
import { CreateCouponMerchantDto } from './dto/create-coupon-merchant.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

export interface CouponResolution {
  coupon: Coupon;
  discountAmount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private validateDiscountFields(discountType: string, percentage?: number, fixedAmount?: number) {
    if (discountType === 'percentage' && !percentage) {
      throw new BadRequestException('نسبة الخصم مطلوبة لهذا النوع');
    }
    if (discountType === 'fixed' && !fixedAmount) {
      throw new BadRequestException('المبلغ الثابت مطلوب لهذا النوع');
    }
  }

  // --- الإدمن: كوبونات عامة (storeId فارغ دائماً)، تقدر تشمل الطلبات و/أو الاشتراكات ---
  async createAsAdmin(dto: CreateCouponAdminDto) {
    this.validateDiscountFields(dto.discountType, dto.percentage, dto.fixedAmount);
    const code = this.normalizeCode(dto.code);
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('هذا الكود مستخدم بكوبون آخر');
    return this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount,
        maxDiscount: dto.maxDiscount,
        scope: dto.scope ?? 'orders',
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit,
        storeId: null,
      },
    });
  }

  listAsAdmin() {
    return this.prisma.coupon.findMany({ where: { storeId: null }, orderBy: { createdAt: 'desc' } });
  }

  async updateAsAdmin(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon || coupon.storeId !== null) throw new NotFoundException('الكوبون غير موجود');
    return this.applyUpdate(coupon, dto);
  }

  async removeAsAdmin(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon || coupon.storeId !== null) throw new NotFoundException('الكوبون غير موجود');
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  // --- التاجر: كوبونات مقفلة على متجره فقط، نطاقها دائماً "طلبات" ---
  async createAsMerchant(ownerUserId: string, dto: CreateCouponMerchantDto) {
    this.validateDiscountFields(dto.discountType, dto.percentage, dto.fixedAmount);
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const code = this.normalizeCode(dto.code);
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('هذا الكود مستخدم بكوبون آخر');
    return this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount,
        maxDiscount: dto.maxDiscount,
        scope: 'orders',
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit,
        storeId: store.id,
      },
    });
  }

  async listAsMerchant(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.coupon.findMany({ where: { storeId: store.id }, orderBy: { createdAt: 'desc' } });
  }

  async updateAsMerchant(ownerUserId: string, id: string, dto: UpdateCouponDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon || coupon.storeId !== store.id) throw new NotFoundException('الكوبون غير موجود');
    // التاجر ما يقدر يغيّر نطاق كوبونه — يبقى "طلبات" دائماً
    return this.applyUpdate(coupon, { ...dto, scope: undefined });
  }

  async removeAsMerchant(ownerUserId: string, id: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon || coupon.storeId !== store.id) throw new NotFoundException('الكوبون غير موجود');
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  private applyUpdate(coupon: Coupon, dto: UpdateCouponDto) {
    if (dto.discountType) {
      this.validateDiscountFields(
        dto.discountType,
        dto.percentage ?? (coupon.percentage ? Number(coupon.percentage) : undefined),
        dto.fixedAmount ?? (coupon.fixedAmount ? Number(coupon.fixedAmount) : undefined),
      );
    }
    const data: Prisma.CouponUpdateInput = {
      discountType: dto.discountType ?? coupon.discountType,
      percentage: dto.percentage ?? coupon.percentage,
      fixedAmount: dto.fixedAmount ?? coupon.fixedAmount,
      maxDiscount: dto.maxDiscount ?? coupon.maxDiscount,
      startsAt: dto.startsAt !== undefined ? (dto.startsAt ? new Date(dto.startsAt) : null) : coupon.startsAt,
      expiresAt: dto.expiresAt !== undefined ? (dto.expiresAt ? new Date(dto.expiresAt) : null) : coupon.expiresAt,
      usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : coupon.usageLimit,
      active: dto.active ?? coupon.active,
    };
    if (dto.scope) data.scope = dto.scope;
    return this.prisma.coupon.update({ where: { id: coupon.id }, data });
  }

  // --- التحقق والتطبيق — يُستخدم عند إنشاء الطلب، تسجيل/تجديد الاشتراك، وشاشة السلة (معاينة) ---
  async resolveCoupon(
    code: string,
    opts: { storeId?: string | null; scope: Extract<CouponScope, 'orders' | 'subscriptions'>; amount: number },
  ): Promise<CouponResolution> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: this.normalizeCode(code) } });
    if (!coupon || !coupon.active) throw new BadRequestException('كود الخصم غير صحيح');

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('كود الخصم لم يبدأ سريانه بعد');
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('انتهت صلاحية كود الخصم');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('تم استنفاد عدد مرات استخدام هذا الكود');
    }
    if (coupon.scope !== 'both' && coupon.scope !== opts.scope) {
      throw new BadRequestException('كود الخصم غير صالح لهذا النوع من العمليات');
    }
    if (coupon.storeId && coupon.storeId !== opts.storeId) {
      throw new BadRequestException('كود الخصم غير صالح لهذا المتجر');
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (opts.amount * Number(coupon.percentage)) / 100;
      if (coupon.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      discountAmount = Number(coupon.fixedAmount);
    }
    discountAmount = Math.max(0, Math.min(discountAmount, opts.amount));
    discountAmount = Math.round(discountAmount * 100) / 100;

    return { coupon, discountAmount };
  }

  // يُستدعى ضمن نفس معاملة إنشاء الطلب/الاشتراك بعد التأكد من resolveCoupon
  redeem(tx: Prisma.TransactionClient, couponId: string) {
    return tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  }
}

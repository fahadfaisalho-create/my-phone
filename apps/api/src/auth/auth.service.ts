import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { SubscriptionPlan, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types';
import { MailService } from '../mail/mail.service';
import { CouponsService } from '../coupons/coupons.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // ساعة واحدة

// أسعار الباقات حسب المواصفات (300 / 1,200 / 2,000 ﷼)
const PLAN_PRICE: Record<SubscriptionPlan, number> = {
  monthly: 300,
  six_months: 1200,
  yearly: 2000,
};

function planEndDate(start: Date, plan: SubscriptionPlan): Date {
  const end = new Date(start);
  if (plan === 'monthly') end.setMonth(end.getMonth() + 1);
  else if (plan === 'six_months') end.setMonth(end.getMonth() + 6);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

export interface UploadedFiles {
  logo?: Express.Multer.File[];
  crFile?: Express.Multer.File[];
  bankFile?: Express.Multer.File[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly couponsService: CouponsService,
  ) {}

  private async issueToken(user: {
    id: string;
    role: UserRole;
    email: string | null;
  }, storeId?: string | null) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      storeId: storeId ?? null,
    };
    return this.jwt.sign(payload);
  }

  // تسجيل دخول موحّد للتاجر والإدارة (بريد + كلمة سر)
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || user.role === 'consumer') {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة السر غير صحيحة');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة السر غير صحيحة');
    }

    let store: { id: string; status: string } | null = null;
    if (user.role === 'merchant_rep') {
      store = await this.prisma.store.findFirst({
        where: { ownerUserId: user.id },
        select: { id: true, status: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    const token = await this.issueToken(user, store?.id ?? null);
    return {
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      store,
    };
  }

  async registerMerchant(dto: RegisterMerchantDto, files: UploadedFiles) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
    }

    const isIndividual = dto.providerType === 'individual';

    // للمحل: ملف السجل التجاري. للفني المستقل: نفس حقل الرفع لكن يمثّل الهوية/رخصة العمل الحر
    const crFile = files.crFile?.[0];
    const bankFile = files.bankFile?.[0];
    if (!crFile) {
      throw new ConflictException(
        isIndividual ? 'ملف الهوية أو رخصة العمل الحر مطلوب' : 'ملف السجل التجاري مطلوب',
      );
    }
    if (!bankFile) {
      throw new ConflictException('ملف تصديق الحساب البنكي مطلوب');
    }
    const logo = files.logo?.[0];

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    const result = await this.prisma.$transaction(
      async (tx) => {
      const user = await tx.user.create({
        data: {
          role: 'merchant_rep',
          name: dto.repName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
        },
      });

      const store = await tx.store.create({
        data: {
          ownerUserId: user.id,
          name: dto.storeName,
          providerType: dto.providerType ?? 'company',
          commercialRegisterNo: isIndividual ? null : dto.commercialRegisterNo,
          nationalId: isIndividual ? dto.nationalId : null,
          taxNo: dto.taxNo,
          iban: dto.iban,
          logoUrl: logo ? `/uploads/logos/${logo.filename}` : null,
          crFileUrl: `/uploads/cr/${crFile.filename}`,
          bankCertificateFileUrl: `/uploads/bank/${bankFile.filename}`,
          status: 'pending',
        },
      });

      // الفني المستقل ما عنده فرع فعلي — نسوي له فرعاً تلقائياً يمثّل منطقة خدمته
      // حتى يعمل نظام الحجوزات الحالي بدون أي تعديل (كل حجز يتطلب فرعاً)
      if (isIndividual) {
        await tx.branch.create({
          data: {
            storeId: store.id,
            name: 'المنطقة التي أخدمها',
            address: dto.serviceArea?.trim() || null,
          },
        });
      }

      // كوبون خصم على سعر الاشتراك (اختياري) — كوبونات الإدمن فقط (المقفلة على متجر
      // ما تنطبق هنا أصلاً لأن نطاقها دائماً "orders")
      let couponId: string | null = null;
      let discountAmount: number | null = null;
      let taxableAmount = PLAN_PRICE[dto.plan];
      if (dto.couponCode) {
        const resolved = await this.couponsService.resolveCoupon(dto.couponCode, {
          storeId: store.id,
          scope: 'subscriptions',
          amount: taxableAmount,
        });
        couponId = resolved.coupon.id;
        discountAmount = resolved.discountAmount;
        taxableAmount -= discountAmount;
        await this.couponsService.redeem(tx, resolved.coupon.id);
      }

      // ضريبة القيمة المضافة (15%) — المنصة هي البائع هنا (تبيع خدمة الاشتراك للمحل
      // مباشرة)، فتُضاف دائماً فوق سعر الباقة بعد الخصم
      const vatAmount = Math.round(taxableAmount * 0.15 * 100) / 100;
      const price = taxableAmount + vatAmount;

      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan: dto.plan,
          price,
          startDate: now,
          endDate: planEndDate(now, dto.plan),
          status: 'active',
          couponId,
          discountAmount,
          vatAmount,
        },
      });

      return { user, store };
      },
      // مهلة أطول من الافتراضي — عدة عمليات إنشاء (مستخدم/محل/فرع/اشتراك) + كوبون محتمل
      { timeout: 15000 },
    );

    const token = await this.issueToken(result.user, result.store.id);
    return {
      accessToken: token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      store: { id: result.store.id, status: result.store.status },
    };
  }

  // نسيت كلمة السر (تاجر/إدمن فقط): يرسل رمز استعادة بالبريد إن وُجد الحساب
  // — الرد دائماً عام (لا يفصح إن كان البريد مسجّلاً أم لا) لتفادي تسريب المعلومات
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user && user.passwordHash && user.role !== 'consumer') {
      const token = randomBytes(24).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });
      this.mail.sendPasswordResetToken(user.email!, token).catch(() => undefined);
    }
    return { message: 'إذا كان البريد مسجلاً لدينا، ستصلك رسالة برمز الاستعادة' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { resetToken: dto.token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry.getTime() < Date.now()) {
      throw new BadRequestException('رمز الاستعادة غير صحيح أو منتهي الصلاحية');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: 'تم تحديث كلمة السر بنجاح' };
  }
}

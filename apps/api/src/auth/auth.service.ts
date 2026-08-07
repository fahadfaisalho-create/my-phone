import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SubscriptionPlan, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types';

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

    const crFile = files.crFile?.[0];
    const bankFile = files.bankFile?.[0];
    if (!crFile) {
      throw new ConflictException('ملف السجل التجاري مطلوب');
    }
    if (!bankFile) {
      throw new ConflictException('ملف تصديق الحساب البنكي مطلوب');
    }
    const logo = files.logo?.[0];

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
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
          commercialRegisterNo: dto.commercialRegisterNo,
          taxNo: dto.taxNo,
          iban: dto.iban,
          logoUrl: logo ? `/uploads/logos/${logo.filename}` : null,
          crFileUrl: `/uploads/cr/${crFile.filename}`,
          bankCertificateFileUrl: `/uploads/bank/${bankFile.filename}`,
          status: 'pending',
        },
      });

      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan: dto.plan,
          price: PLAN_PRICE[dto.plan],
          startDate: now,
          endDate: planEndDate(now, dto.plan),
          status: 'active',
        },
      });

      return { user, store };
    });

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
}

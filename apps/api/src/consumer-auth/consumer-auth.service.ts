import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/types';

interface SessionUser {
  id: string;
  role: UserRole;
  email: string | null;
  name: string;
  phone: string | null;
}

@Injectable()
export class ConsumerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // تستخدمه الواجهة بعد ما المستخدم يدخل رقمه: لو مسجّل تعرض خانة "كلمة
  // السر" (تسجيل دخول)، ولو مو مسجّل تعرض خانتي "كلمة السر + الاسم" (حساب جديد)
  async checkPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return { registered: !!user && user.role === 'consumer' };
  }

  async register(phone: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException(
        existing.role === 'consumer'
          ? 'رقم الجوال مسجّل مسبقاً — سجّل الدخول بدلاً من ذلك'
          : 'رقم الجوال مستخدم بحساب آخر',
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { role: 'consumer', name: name.trim(), phone, passwordHash },
    });
    return this.issueSession(user);
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || user.role !== 'consumer' || !user.passwordHash) {
      throw new UnauthorizedException('رقم الجوال أو كلمة السر غير صحيحة');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('رقم الجوال أو كلمة السر غير صحيحة');
    }
    return this.issueSession(user);
  }

  private issueSession(user: SessionUser) {
    const payload: JwtPayload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    };
  }
}

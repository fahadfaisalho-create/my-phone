import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { JwtPayload } from '../auth/types';

@Injectable()
export class ConsumerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  requestOtp(phone: string) {
    const code = this.otp.generate(phone);
    const isProd = process.env.NODE_ENV === 'production';
    return {
      message: 'تم إرسال رمز التحقق',
      // بما إنه ما فيه بوابة SMS فعلية بعد، نُرجع الرمز هنا في غير بيئة الإنتاج فقط
      // لتسهيل الاختبار (تماماً كملاحظة "الدفع الفعلي يُربط لاحقاً" في مواصفات الاشتراك)
      ...(isProd ? {} : { devOtp: code }),
    };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const ok = this.otp.verify(phone, code);
    if (!ok) {
      throw new BadRequestException('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { role: 'consumer', name: name?.trim() || phone, phone },
      });
    }
    if (user.role !== 'consumer') {
      throw new UnauthorizedException('هذا الرقم مسجّل بدور مختلف');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    };
  }
}

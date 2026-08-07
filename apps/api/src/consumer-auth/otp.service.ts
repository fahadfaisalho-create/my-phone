import { Injectable, Logger } from '@nestjs/common';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 دقائق
const MAX_ATTEMPTS = 5;

// تخزين مؤقت في الذاكرة — كافٍ لتطوير/اختبار المرحلة الحالية على نسخة واحدة من السيرفر.
// TODO: عند التوسع لأكثر من instance، يُستبدل بـ Redis أو جدول DB مع TTL.
// TODO: الإرسال الفعلي عبر بوابة SMS (تُحدَّد لاحقاً) — حالياً يُطبع الرمز في اللوق فقط،
// تماماً بنفس منطق "الدفع الفعلي يُربط لاحقاً" في مواصفات الاشتراك.
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly store = new Map<string, OtpEntry>();

  generate(phone: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    // بديل مؤقت عن إرسال SMS فعلي:
    this.logger.log(`OTP for ${phone}: ${code} (صالح 5 دقائق)`);
    return code;
  }

  verify(phone: string, code: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      return false;
    }
    entry.attempts += 1;
    if (entry.attempts > MAX_ATTEMPTS) {
      this.store.delete(phone);
      return false;
    }
    const ok = entry.code === code;
    if (ok) this.store.delete(phone);
    return ok;
  }
}

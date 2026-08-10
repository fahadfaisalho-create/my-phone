import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// خدمة بريد بسيطة: إذا كانت بيانات SMTP مضبوطة في env يتم الإرسال فعلياً،
// وإذا لم تكن مضبوطة بعد (الوضع الحالي) يتم تسجيل محتوى الرسالة في الـ log فقط
// دون رمي خطأ — نفس نمط تأجيل بوابة الدفع الفعلية لحين توفر حساب/بيانات اعتماد حقيقية.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM') || 'no-reply@example.com';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    }
  }

  private async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.log(
        `[بريد غير مُرسل — SMTP غير مضبوط بعد] إلى: ${to} | الموضوع: ${subject}\n${text}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (err) {
      // لا نكسر عملية الإدارة إذا فشل إرسال البريد — نسجل الخطأ فقط
      this.logger.error(`فشل إرسال البريد إلى ${to}: ${(err as Error).message}`);
    }
  }

  async sendStoreRejection(to: string, storeName: string, reason: string) {
    await this.send(
      to,
      `تحديث بخصوص طلب تسجيل محلك "${storeName}"`,
      `عذراً، تم رفض طلب تسجيل محلك "${storeName}" على My Phone.\n\nسبب الرفض:\n${reason}\n\nيمكنك تعديل بيانات التسجيل وإعادة الإرسال دون الحاجة لإنشاء حساب جديد.`,
    );
  }

  async sendStoreApproval(to: string, storeName: string) {
    await this.send(
      to,
      `تم قبول محلك "${storeName}"`,
      `تهانينا! تم قبول طلب تسجيل محلك "${storeName}" على My Phone. يمكنك الآن تسجيل الدخول وإكمال إعداد محلك.`,
    );
  }

  async sendPasswordResetToken(to: string, token: string) {
    await this.send(
      to,
      'استعادة كلمة السر — My Phone',
      `وصلنا طلب استعادة كلمة السر لحسابك.\n\nرمز الاستعادة الخاص بك:\n${token}\n\nأدخل هذا الرمز في صفحة "استعادة كلمة السر" مع كلمة السر الجديدة. الرمز صالح لمدة ساعة واحدة فقط.\n\nإذا لم تطلب هذا، تجاهل هذه الرسالة.`,
    );
  }
}

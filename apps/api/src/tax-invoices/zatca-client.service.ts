import { Injectable } from '@nestjs/common';
import { PlatformSettings } from '@prisma/client';

export interface ZatcaSubmissionPayload {
  invoiceNo: string;
  icv: number;
  previousInvoiceHash: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  storeName: string;
  settings: PlatformSettings;
}

export interface ZatcaSubmissionResult {
  status: 'accepted' | 'accepted_with_warnings' | 'rejected';
  uuid: string;
  invoiceHash: string;
  qrData: string | null;
  message: string;
}

// عميل بوابة فاتورة (زاتكا) — الآن محاكاة بالكامل، لا يتصل بأي API خارجي فعلي.
// الهدف من عزله بهذا الشكل: عند توفر شهادة اعتماد (CSID) حقيقية من زاتكا لاحقاً،
// يكفي استبدال جسم submit() بالاستدعاء الفعلي (توليد UBL XML + توقيع + إرسال
// compliance/reporting/clearance) بدون أي تغيير في بقية النظام (الخدمة/الأدمن).
@Injectable()
export class ZatcaClientService {
  async submit(payload: ZatcaSubmissionPayload): Promise<ZatcaSubmissionResult> {
    // شرط فشل واقعي وقت المحاكاة: زاتكا الفعلية ترفض أي بائع بدون رقم ضريبي/سجل
    // تجاري مسجَّل — نفس المتطلب هنا، مربوط ببيانات إعدادات المنصة الفعلية
    // (admin/settings)، فيصير باستطاعة الإدمن "يصلح" السبب ثم يضغط إعادة إرسال.
    if (!payload.settings.platformVatNo?.trim() || !payload.settings.platformCrNo?.trim()) {
      return {
        status: 'rejected',
        uuid: '',
        invoiceHash: this.hash(payload, payload.previousInvoiceHash),
        qrData: null,
        message:
          'تعذر الإرسال: الرقم الضريبي و/أو السجل التجاري للمنصة غير معبّأين في إعدادات الفوترة — عبّهما ثم أعد الإرسال.',
      };
    }

    const invoiceHash = this.hash(payload, payload.previousInvoiceHash);
    const uuid = `mock-${payload.icv.toString().padStart(8, '0')}-${Date.now().toString(36)}`;
    // TLV/QR الحقيقي يُبنى بترميز base64 لحقول (اسم البائع، الرقم الضريبي، الطابع
    // الزمني، الإجمالي، الضريبة، هاش الفاتورة...) — هنا Placeholder بنفس الشكل العام
    const qrData = Buffer.from(
      `${payload.storeName}|${payload.settings.platformVatNo}|${payload.total}|${payload.vatAmount}|${invoiceHash}`,
    ).toString('base64');

    return {
      status: 'accepted',
      uuid,
      invoiceHash,
      qrData,
      message: 'تم قبول الفاتورة (محاكاة — الربط الفعلي ببوابة فاتورة غير مفعّل بعد).',
    };
  }

  private hash(payload: ZatcaSubmissionPayload, previousHash: string | null): string {
    // هاش مبسّط للتسلسل محلياً فقط (ليس خوارزمية زاتكا الرسمية) — يكفي لضمان
    // أن كل فاتورة ترتبط بسابقتها لحد ربط الحساب الفعلي
    const crypto = require('crypto') as typeof import('crypto');
    return crypto
      .createHash('sha256')
      .update(`${previousHash ?? ''}|${payload.invoiceNo}|${payload.total}|${payload.vatAmount}`)
      .digest('hex');
  }
}

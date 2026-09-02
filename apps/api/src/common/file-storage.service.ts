import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname } from 'path';

// تخزين الملفات المرفوعة (صور المنتجات، شعارات المحلات، ملفات السجل
// التجاري، رخص الفنيين، صور الشات...) — Cloudflare R2 (متوافق مع S3) إذا
// كانت بيانات الاعتماد مضبوطة بالبيئة، وإلا يرجع لتخزين محلي مؤقت على قرص
// السيرفر (وضع التطوير فقط — القرص المحلي بالإنتاج غير دائم، يُمسح مع كل
// نشر تحديث؛ لا يصلح للاستخدام الفعلي). نفس نمط MailService بالضبط
// (يعمل بدون كسر شيء لو بيانات الاعتماد غير موجودة بعد).
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.publicBaseUrl = (this.config.get<string>('R2_PUBLIC_URL') ?? '').replace(/\/$/, '');

    if (accountId && accessKeyId && secretAccessKey && this.bucket && this.publicBaseUrl) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log('تخزين الملفات: Cloudflare R2 مفعّل');
    } else {
      this.logger.warn(
        'تخزين الملفات: R2 غير مضبوط بعد — رجوع مؤقت لتخزين محلي على قرص السيرفر (غير دائم بالإنتاج)',
      );
    }
  }

  get isCloudEnabled(): boolean {
    return !!this.s3;
  }

  // يرفع ملف واحد ويرجع رابطه العام الكامل — subfolder نفس تقسيم
  // FIELD_SUBFOLDER القديم (logos/cr/bank/products/technicians/licenses/
  // certificates/chat) حتى تبقى الملفات منظّمة بنفس الطريقة
  async upload(file: Express.Multer.File, subfolder: string): Promise<string> {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const key = `${subfolder}/${filename}`;

    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      return `${this.publicBaseUrl}/${key}`;
    }

    // رجوع محلي (تطوير فقط) — يكتب على قرص السيرفر مباشرة من buffer الملف
    // بما إن multer الآن يستخدم memoryStorage بدل diskStorage
    const dir = `./uploads/${subfolder}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${filename}`, file.buffer);
    return `/uploads/${subfolder}/${filename}`;
  }
}

import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

// الملفات تُستقبل بالذاكرة (buffer) لا القرص — FileStorageService هو اللي
// يرفعها فعلياً (Cloudflare R2 بالإنتاج، أو قرص محلي مؤقت وقت التطوير فقط)
export const UPLOADS_ROOT = 'uploads';

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

// يوجّه كل حقل رفع (logo / crFile / bankFile) إلى مجلد فرعي خاص به بحسب fieldname
// — نفس التقسيم يُستخدم كـ subfolder عند الرفع لـ FileStorageService
export const FIELD_SUBFOLDER: Record<string, string> = {
  logo: 'logos',
  crFile: 'cr',
  bankFile: 'bank',
  image: 'products',
  productImage: 'products',
  chatImage: 'chat',
  photo: 'technicians',
  freelanceLicenseFile: 'licenses',
  certificateFile: 'certificates',
};

export const registrationFilesStorage = memoryStorage();

export function fileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    cb(new BadRequestException('صيغة الملف غير مدعومة (المسموح: صور أو PDF)'), false);
    return;
  }
  cb(null, true);
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

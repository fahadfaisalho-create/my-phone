import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

// تخزين محلي مؤقت للملفات (السجل التجاري، تصديق الحساب البنكي، الشعار، صور المنتجات).
// TODO: عند التوسع، استبدل diskStorage بتحميل مباشر إلى Cloudflare R2 / AWS S3 حسب المواصفات
// (نفس واجهة الـ Controller تبقى كما هي، فقط طبقة التخزين تتغير).
export const UPLOADS_ROOT = 'uploads';

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

// يوجّه كل حقل رفع (logo / crFile / bankFile) إلى مجلد فرعي خاص به بحسب fieldname
const FIELD_SUBFOLDER: Record<string, string> = {
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

export const registrationFilesStorage = diskStorage({
  destination: (_req, file, cb) => {
    const subfolder = FIELD_SUBFOLDER[file.fieldname] ?? 'misc';
    cb(null, `./${UPLOADS_ROOT}/${subfolder}`);
  },
  filename: (_req, file, cb) => {
    const unique = randomUUID();
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

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

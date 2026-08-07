import { IsOptional, IsString } from 'class-validator';

// يُستخدم لتعديل بيانات المحل، وأيضاً لإعادة الإرسال بعد الرفض (بدون إنشاء حساب جديد)
export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  commercialRegisterNo?: string;

  @IsOptional()
  @IsString()
  taxNo?: string;

  @IsOptional()
  @IsString()
  iban?: string;
}

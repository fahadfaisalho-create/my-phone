import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'صيغة رقم الجوال غير صحيحة' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'رمز التحقق مكوّن من 6 أرقام' })
  code: string;

  // يُستخدم فقط عند إنشاء الحساب لأول مرة
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterConsumerDto {
  @IsString()
  @IsNotEmpty({ message: 'رقم الجوال مطلوب' })
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'صيغة رقم الجوال غير صحيحة' })
  phone: string;

  // صاحب الحساب هو اللي يحدد كلمة سره مباشرة عند التسجيل (بدون رمز تحقق SMS)
  @IsString()
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'اسم الحساب مطلوب' })
  name: string;
}

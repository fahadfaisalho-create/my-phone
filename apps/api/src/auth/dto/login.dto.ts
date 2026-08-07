import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة السر مطلوبة' })
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  password: string;
}

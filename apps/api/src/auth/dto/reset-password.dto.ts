import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز الاستعادة مطلوب' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;
}

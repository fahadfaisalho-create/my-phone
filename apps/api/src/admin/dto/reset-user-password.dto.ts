import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// الإدمن يحدد كلمة سر جديدة مباشرة لأي حساب (تاجر/موظف/مستهلك) بحثاً بالبريد
// أو رقم الجوال — بديل عملي بلا تكلفة عن بريد/SMS استعادة فعلي غير مربوط بعد
export class ResetUserPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'البريد الإلكتروني أو رقم الجوال مطلوب' })
  identifier: string;

  @IsString()
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;
}

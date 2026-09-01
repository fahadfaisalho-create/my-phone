import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EmployeeLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'رقم الجوال مطلوب' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة السر مطلوبة' })
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  password: string;
}

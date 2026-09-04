import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConsumerLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'رقم الجوال مطلوب' })
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'صيغة رقم الجوال غير صحيحة' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة السر مطلوبة' })
  password: string;
}

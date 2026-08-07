import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'رقم الجوال مطلوب' })
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'صيغة رقم الجوال غير صحيحة' })
  phone: string;
}

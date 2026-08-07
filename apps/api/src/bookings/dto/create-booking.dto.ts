import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsDateString({}, { message: 'صيغة الموعد غير صحيحة (ISO date)' })
  scheduledAt: string;
}

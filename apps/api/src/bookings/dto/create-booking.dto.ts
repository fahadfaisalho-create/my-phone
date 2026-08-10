import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VisitType } from '@prisma/client';

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

  // نوع الحجز: بالمحل أو زيارة منزلية — إذا لم يُرسل يُعتبر "بالمحل"
  @IsOptional()
  @IsEnum(VisitType, { message: 'نوع الحجز غير صحيح' })
  visitType?: VisitType;

  // إلزامي فقط عند اختيار الزيارة المنزلية (يُتحقق منه بالخدمة)
  @IsOptional()
  @IsString()
  customerAddress?: string;
}

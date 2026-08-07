import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceSupport } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم الخدمة مطلوب' })
  name: string;

  @IsOptional()
  @IsEnum(DeviceSupport, { message: 'قيمة الأجهزة المدعومة غير صحيحة' })
  deviceSupport?: DeviceSupport;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'سعر شغل اليد يجب أن يكون رقماً' })
  @Min(0)
  laborPrice?: number;

  @IsOptional()
  @IsString()
  linkedProductId?: string;
}

import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// يُستخدم لتعديل بيانات المحل، وأيضاً لإعادة الإرسال بعد الرفض (بدون إنشاء حساب جديد)
export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  commercialRegisterNo?: string;

  // رقم الهوية الوطنية — للفنيين المستقلين فقط
  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  taxNo?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  // تفعيل/إيقاف خدمة التوصيل للطلبات — بيانات فقط حالياً (بانتظار التنسيق مع أرامكس)
  // (تصل كنص عبر multipart/form-data، لذا تُحوَّل يدوياً بدل الاعتماد على Type(Boolean))
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  supportsDelivery?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'رسوم التوصيل يجب أن تكون رقماً موجباً' })
  deliveryFee?: number;

  // توصيل داخلي بمناديب المحل: نطاق تغطية دائري (نقطة مركزية + نصف قطر بالكم) وسعره
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  supportsAgentDelivery?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'سعر توصيل المندوب يجب أن يكون رقماً موجباً' })
  agentDeliveryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agentZoneLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agentZoneLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1, { message: 'نصف قطر النطاق يجب أن يكون أكبر من صفر' })
  agentZoneRadiusKm?: number;
}

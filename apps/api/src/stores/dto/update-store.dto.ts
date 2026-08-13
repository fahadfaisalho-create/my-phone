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
}

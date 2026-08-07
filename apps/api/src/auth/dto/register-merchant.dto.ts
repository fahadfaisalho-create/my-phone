import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

// يصل عبر multipart/form-data (يرافقه ملفات: logo، crFile، bankFile)
export class RegisterMerchantDto {
  // بيانات ممثل الشركة
  @IsString()
  @IsNotEmpty({ message: 'اسم الممثل مطلوب' })
  repName: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // البيانات الأساسية للمحل
  @IsString()
  @IsNotEmpty({ message: 'اسم المحل مطلوب' })
  storeName: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم السجل التجاري مطلوب' })
  commercialRegisterNo: string;

  @IsOptional()
  @IsString()
  taxNo?: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الآيبان مطلوب' })
  iban: string;

  // الباقة
  @IsEnum(SubscriptionPlan, { message: 'خطة الاشتراك غير صحيحة' })
  plan: SubscriptionPlan;
}

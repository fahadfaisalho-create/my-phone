import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { SubscriptionPlan, StoreProviderType } from '@prisma/client';

// يصل عبر multipart/form-data (يرافقه ملفات: logo، crFile، bankFile)
export class RegisterMerchantDto {
  // بيانات ممثل الشركة / الفني المستقل نفسه
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

  // نوع مزوّد الخدمة — إذا لم يُرسل يُعتبر "محل/شركة" (السلوك القديم)
  @IsOptional()
  @IsEnum(StoreProviderType, { message: 'نوع الحساب غير صحيح' })
  providerType?: StoreProviderType;

  // البيانات الأساسية للمحل / اسم الفني الظاهر للعملاء
  @IsString()
  @IsNotEmpty({ message: 'اسم المحل مطلوب' })
  storeName: string;

  // إلزامي للمحلات فقط
  @ValidateIf((o) => o.providerType !== 'individual')
  @IsString()
  @IsNotEmpty({ message: 'رقم السجل التجاري مطلوب' })
  commercialRegisterNo?: string;

  // إلزامي للأفراد المستقلين فقط — بديل السجل التجاري
  @ValidateIf((o) => o.providerType === 'individual')
  @IsString()
  @IsNotEmpty({ message: 'رقم الهوية الوطنية مطلوب' })
  nationalId?: string;

  // المنطقة التي يخدمها الفني المستقل (تُستخدم كعنوان فرعه التلقائي)
  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  taxNo?: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الآيبان مطلوب' })
  iban: string;

  // الباقة
  @IsEnum(SubscriptionPlan, { message: 'خطة الاشتراك غير صحيحة' })
  plan: SubscriptionPlan;

  // كود كوبون خصم على اشتراك المنصة (اختياري) — كوبونات الإدمن فقط
  @IsOptional()
  @IsString()
  couponCode?: string;
}

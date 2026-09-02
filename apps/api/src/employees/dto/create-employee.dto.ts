import { ArrayUnique, IsArray, IsDateString, IsEmail, IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { StoreSection } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'اسم العائلة مطلوب' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الجوال مطلوب' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الهوية مطلوب' })
  nationalId: string;

  @IsDateString({}, { message: 'تاريخ الميلاد غير صحيح' })
  birthDate: string;

  // البريد الإلكتروني هو معرّف دخول الموظف (يدخل من نفس صفحة تسجيل الدخول
  // ببريده وكلمة سره) — إجباري، بعكس رقم الجوال اللي هو بيانات تعريف فقط
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  // صاحب المحل هو اللي يحدد كلمة سر الموظف مباشرة (بدل توليدها عشوائياً)
  @IsString()
  @MinLength(6, { message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  // الأقسام (تبويبات لوحة التاجر) المسموح للموظف الوصول لها
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(StoreSection, { each: true, message: 'قسم صلاحية غير صحيح' })
  permissions?: StoreSection[];

  // نطاق الحضور الجغرافي — الثلاثة تُرسل معاً أو تُترك فارغة كلها
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'إحداثية خط العرض غير صحيحة' })
  attendanceLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'إحداثية خط الطول غير صحيحة' })
  attendanceLng?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(10, { message: 'نطاق الحضور يجب أن يكون 10 أمتار على الأقل' })
  attendanceRadiusM?: number;
}

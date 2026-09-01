import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم الموظف مطلوب' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'الجنسية مطلوبة' })
  nationality: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'سنوات الخبرة يجب أن تكون رقماً صحيحاً' })
  @Min(0)
  experienceYears?: number;

  // رخصة العمل الحر إجبارية — رقم الرخصة (الملف يُرفع كملف منفصل ويُتحقق من
  // وجوده بالخدمة) — الفني لا يظهر للمستهلكين على صفحة المحل العامة إلا بعد
  // مراجعة الإدمن ليدوياً والتأكد من مطابقتها
  @IsString()
  @IsNotEmpty({ message: 'رقم رخصة العمل الحر مطلوب' })
  freelanceLicenseNo: string;
}

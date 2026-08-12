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

  // رخصة العمل الحر اختيارية — رقم الرخصة فقط (الملف يُرفع كملف منفصل)
  @IsOptional()
  @IsString()
  freelanceLicenseNo?: string;
}

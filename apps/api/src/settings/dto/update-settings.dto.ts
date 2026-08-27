import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'السعر اليومي يجب أن يكون رقماً موجباً' })
  adDailyRate: number;

  // بيانات البائع الرسمي على الفاتورة الضريبية (زاتكا) — راجع تعليق
  // PlatformSettings في schema.prisma
  @IsOptional()
  @IsString()
  platformLegalName?: string;

  @IsOptional()
  @IsString()
  platformVatNo?: string;

  @IsOptional()
  @IsString()
  platformCrNo?: string;
}

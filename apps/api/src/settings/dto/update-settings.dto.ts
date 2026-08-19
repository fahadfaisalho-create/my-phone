import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'السعر اليومي يجب أن يكون رقماً موجباً' })
  adDailyRate: number;
}

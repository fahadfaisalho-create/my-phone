import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CreateStoreAdDto {
  @Type(() => Number)
  @IsInt({ message: 'عدد الأيام يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'أقل مدة إعلان يوم واحد' })
  @Max(90, { message: 'أقصى مدة إعلان 90 يوماً' })
  days: number;
}

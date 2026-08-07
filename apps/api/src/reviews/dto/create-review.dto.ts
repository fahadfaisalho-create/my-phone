import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'التقييم من 1 إلى 5 نجوم' })
  @Max(5, { message: 'التقييم من 1 إلى 5 نجوم' })
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

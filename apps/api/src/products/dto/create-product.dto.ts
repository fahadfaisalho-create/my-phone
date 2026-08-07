import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم المنتج مطلوب' })
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'السعر يجب أن يكون رقماً' })
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الكمية يجب أن تكون رقماً صحيحاً' })
  @Min(0)
  quantity?: number;
}

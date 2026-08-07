import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم الفرع مطلوب' })
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'خط العرض يجب أن يكون رقماً' })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'خط الطول يجب أن يكون رقماً' })
  lng?: number;
}

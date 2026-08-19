import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'اكتب كود الخصم' })
  code: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponDiscountType, CouponScope } from '@prisma/client';

// كوبون يصدره الإدمن — عام على كل المتاجر (لا يقبل storeId إطلاقاً)، ونطاقه
// يقدر يشمل طلبات المستهلكين و/أو اشتراكات المحلات بالمنصة
export class CreateCouponAdminDto {
  @IsString()
  @IsNotEmpty({ message: 'كود الكوبون مطلوب' })
  code: string;

  @IsEnum(CouponDiscountType, { message: 'نوع الخصم غير صحيح' })
  discountType: CouponDiscountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'نسبة الخصم يجب أن تكون بين 1 و100' })
  @Max(100, { message: 'نسبة الخصم يجب أن تكون بين 1 و100' })
  percentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'المبلغ الثابت يجب أن يكون أكبر من صفر' })
  fixedAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsEnum(CouponScope, { message: 'نطاق الكوبون غير صحيح' })
  scope?: CouponScope;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;
}

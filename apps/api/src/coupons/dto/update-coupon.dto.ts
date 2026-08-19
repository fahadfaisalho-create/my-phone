import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponAdminDto } from './create-coupon-admin.dto';

export class UpdateCouponDto extends PartialType(CreateCouponAdminDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

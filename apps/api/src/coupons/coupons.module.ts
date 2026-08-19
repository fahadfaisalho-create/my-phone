import { Module } from '@nestjs/common';
import { AdminCouponsController } from './admin-coupons.controller';
import { MerchantCouponsController } from './merchant-coupons.controller';
import { CouponValidateController } from './coupon-validate.controller';
import { CouponsService } from './coupons.service';

@Module({
  controllers: [AdminCouponsController, MerchantCouponsController, CouponValidateController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}

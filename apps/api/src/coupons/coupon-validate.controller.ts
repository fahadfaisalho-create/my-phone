import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

// معاينة كود الخصم بشاشة السلة قبل إتمام الطلب — لا يُحتسب كاستخدام فعلي
// (الاستخدام الحقيقي يُحتسب عند إنشاء الطلب نفسه)
@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('consumer')
export class CouponValidateController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    const { coupon, discountAmount } = await this.couponsService.resolveCoupon(dto.code, {
      storeId: dto.storeId,
      scope: 'orders',
      amount: dto.amount,
    });
    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount,
    };
  }
}

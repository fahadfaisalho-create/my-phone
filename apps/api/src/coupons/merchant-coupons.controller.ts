import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SectionGuard } from '../auth/guards/section.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireSection } from '../auth/decorators/require-section.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { CouponsService } from './coupons.service';
import { CreateCouponMerchantDto } from './dto/create-coupon-merchant.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('stores/me/coupons')
@UseGuards(JwtAuthGuard, RolesGuard, SectionGuard)
@Roles('merchant_rep', 'employee')
@RequireSection('coupons')
export class MerchantCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.listAsMerchant(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCouponMerchantDto) {
    return this.couponsService.createAsMerchant(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateAsMerchant(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.couponsService.removeAsMerchant(user.id, id);
  }
}

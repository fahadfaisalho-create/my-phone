import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { StoreAdsService } from './store-ads.service';
import { CreateStoreAdDto } from './dto/create-store-ad.dto';

@Controller('stores/me/ads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant_rep')
export class StoreAdsController {
  constructor(private readonly storeAdsService: StoreAdsService) {}

  @Get('rate')
  getRate() {
    return this.storeAdsService.getRate();
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.storeAdsService.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStoreAdDto) {
    return this.storeAdsService.create(user.id, dto);
  }

  @Post(':id/confirm-payment')
  confirmPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.storeAdsService.confirmPayment(user.id, id);
  }
}

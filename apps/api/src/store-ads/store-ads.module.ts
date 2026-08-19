import { Module } from '@nestjs/common';
import { StoreAdsController } from './store-ads.controller';
import { StoreAdsService } from './store-ads.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [StoreAdsController],
  providers: [StoreAdsService],
})
export class StoreAdsModule {}

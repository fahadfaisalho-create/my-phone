import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminSubscriptionsController],
  providers: [AdminService],
})
export class AdminModule {}

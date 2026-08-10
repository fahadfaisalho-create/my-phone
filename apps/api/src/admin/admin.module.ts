import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminService } from './admin.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AdminController, AdminSubscriptionsController, AdminStatsController],
  providers: [AdminService],
})
export class AdminModule {}

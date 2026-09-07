import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './orders.service';
import { CouponsModule } from '../coupons/coupons.module';
import { TaxInvoicesModule } from '../tax-invoices/tax-invoices.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CouponsModule, TaxInvoicesModule, NotificationsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

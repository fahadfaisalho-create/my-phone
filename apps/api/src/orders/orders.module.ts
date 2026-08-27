import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './orders.service';
import { CouponsModule } from '../coupons/coupons.module';
import { TaxInvoicesModule } from '../tax-invoices/tax-invoices.module';

@Module({
  imports: [CouponsModule, TaxInvoicesModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

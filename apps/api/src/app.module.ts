import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FileStorageModule } from './common/file-storage.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { AdminModule } from './admin/admin.module';
import { BranchesModule } from './branches/branches.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { ConsumerAuthModule } from './consumer-auth/consumer-auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookingsModule } from './bookings/bookings.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { MailModule } from './mail/mail.module';
import { TechniciansModule } from './technicians/technicians.module';
import { DeliveryAgentsModule } from './delivery-agents/delivery-agents.module';
import { CouponsModule } from './coupons/coupons.module';
import { SettingsModule } from './settings/settings.module';
import { StoreAdsModule } from './store-ads/store-ads.module';
import { TaxInvoicesModule } from './tax-invoices/tax-invoices.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FileStorageModule,
    AuthModule,
    StoresModule,
    AdminModule,
    BranchesModule,
    ServicesModule,
    ProductsModule,
    ConsumerAuthModule,
    CatalogModule,
    ReviewsModule,
    BookingsModule,
    OrdersModule,
    ChatModule,
    SupportTicketsModule,
    MailModule,
    TechniciansModule,
    DeliveryAgentsModule,
    CouponsModule,
    SettingsModule,
    StoreAdsModule,
    TaxInvoicesModule,
    EmployeesModule,
    AttendanceModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { AdminModule } from './admin/admin.module';
import { BranchesModule } from './branches/branches.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StoresModule,
    AdminModule,
    BranchesModule,
    ServicesModule,
    ProductsModule,
  ],
})
export class AppModule {}

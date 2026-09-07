import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [AuthModule], // لإعادة استخدام JwtModule المُهيّأ مسبقاً (تحقق توكن السوكيت)
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  // تحتاجها وحدات الطلبات/الحجوزات لإرسال إشعار عند إنشاء طلب/حجز أو تغيّر حالته
  exports: [NotificationsService],
})
export class NotificationsModule {}

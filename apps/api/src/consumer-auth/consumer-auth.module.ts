import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConsumerAuthController } from './consumer-auth.controller';
import { ConsumerAuthService } from './consumer-auth.service';
import { OtpService } from './otp.service';

@Module({
  imports: [AuthModule], // لإعادة استخدام JwtModule المُهيّأ مسبقاً
  controllers: [ConsumerAuthController],
  providers: [ConsumerAuthService, OtpService],
})
export class ConsumerAuthModule {}

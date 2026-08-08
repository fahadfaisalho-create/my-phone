import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule], // لإعادة استخدام JwtModule المُهيّأ مسبقاً (تحقق توكن السوكيت)
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}

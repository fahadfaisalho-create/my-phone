import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SenderType, UserRole } from '@prisma/client';
import { ChatService } from './chat.service';
import { JwtPayload } from '../auth/types';

interface SocketData {
  userId: string;
  role: UserRole;
}

// الدردشة الفورية: نفس منطق REST (ChatService) بالضبط، فقط يضيف بث فوري عبر
// غرفة Socket.io واحدة لكل محادثة (chatId). REST يبقى المصدر الأساسي للبيانات
// (يعمل بدون سوكيت أيضاً)، والسوكيت طبقة دفع فوري فوقه.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token || client.handshake.query?.token) as string;
      if (!token) throw new Error('no token');
      const payload = this.jwt.verify<JwtPayload>(token);
      (client.data as SocketData) = { userId: payload.sub, role: payload.role };
    } catch {
      client.emit('error', { message: 'رمز الدخول غير صالح' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`disconnected: ${client.id}`);
  }

  private participantOpts(client: Socket) {
    const data = client.data as SocketData;
    return data.role === 'consumer'
      ? { consumerId: data.userId }
      : { merchantOwnerUserId: data.userId };
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { chatId: string }) {
    try {
      const messages = await this.chatService.listMessages(body.chatId, this.participantOpts(client));
      await client.join(body.chatId);
      return { ok: true, messages };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'تعذّر الانضمام للمحادثة' };
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { chatId: string; text?: string; imageUrl?: string },
  ) {
    const data = client.data as SocketData;
    const senderType: SenderType = data.role === 'consumer' ? 'consumer' : 'merchant';
    try {
      const message = await this.chatService.sendMessage(
        body.chatId,
        senderType,
        data.userId,
        { text: body.text, imageUrl: body.imageUrl },
        this.participantOpts(client),
      );
      this.server.to(body.chatId).emit('message', message);
      return { ok: true, message };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'تعذّر إرسال الرسالة' };
    }
  }
}

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Notification } from '@prisma/client';
import { JwtPayload } from '../auth/types';

// بث فوري للإشعارات — كل مستخدم متصل ينضم تلقائياً لغرفة خاصة باسمه
// (user:<id>) وقت الاتصال، فأي إشعار يُنشأ له (NotificationsService.create)
// يوصله فوراً بدون ما يحتاج يفتح محادثة معيّنة كما بسوكيت الشات
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token || client.handshake.query?.token) as string;
      if (!token) throw new Error('no token');
      const payload = this.jwt.verify<JwtPayload>(token);
      client.join(`user:${payload.sub}`);
    } catch {
      client.emit('error', { message: 'رمز الدخول غير صالح' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`disconnected: ${client.id}`);
  }

  pushToUser(userId: string, notification: Notification) {
    this.server?.to(`user:${userId}`).emit('new', notification);
  }
}

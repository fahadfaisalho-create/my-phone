import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

// إشعارات داخل المنصة (جرس + قائمة) — بديل خفيف بلا تكلفة عن بريد/SMS فعلي.
// كل إشعار يُخزَّن بالقاعدة (يظهر بالقائمة حتى لو المستخدم غير متصل وقتها)
// ويُبث فورياً عبر السوكيت لمن كان متصلاً فعلاً وقت الإنشاء.
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({ data: input });
    this.gateway.pushToUser(input.userId, notification);
    return notification;
  }

  async listMine(userId: string, take = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string) {
    // where بمعرّف المستخدم كمان (لا id فقط) — يمنع أي مستخدم من تعليم إشعار غيره كمقروء
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  }
}

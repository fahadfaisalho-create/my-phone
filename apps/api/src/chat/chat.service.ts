import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SenderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { assertStoreAvailable } from '../common/store-availability.util';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // المستهلك يبدأ محادثة (أو يرجع لنفس المحادثة الموجودة مع نفس المحل)
  async startOrGetChat(consumerId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');
    assertStoreAvailable(store.status, store.subscriptions[0] ?? null);

    return this.prisma.chat.upsert({
      where: { consumerId_storeId: { consumerId, storeId } },
      update: {},
      create: { consumerId, storeId },
    });
  }

  listMineAsConsumer(consumerId: string) {
    return this.prisma.chat.findMany({
      where: { consumerId },
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { name: true, logoUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async listMineAsMerchant(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.chat.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: {
        consumer: { select: { name: true, phone: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  // يتحقق أن المستخدم الحالي (مستهلك أو صاحب المحل) طرف في هذه المحادثة، ويرجعها
  private async getChatForParticipant(
    chatId: string,
    opts: { consumerId?: string; merchantOwnerUserId?: string },
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, include: { store: true } });
    if (!chat) throw new NotFoundException('المحادثة غير موجودة');

    if (opts.consumerId) {
      if (chat.consumerId !== opts.consumerId) throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المحادثة');
      return chat;
    }
    if (opts.merchantOwnerUserId) {
      // opts.merchantOwnerUserId قد يكون صاحب المحل نفسه أو حساباً فرعياً تابعاً
      // له (getOwnedStoreOrThrow تحلّ محل الاثنين) — المقارنة على المحل نفسه
      // وليس على ownerUserId مباشرة، حتى يقدر الموظف صاحب صلاحية "الرسائل" يشارك
      const store = await getOwnedStoreOrThrow(this.prisma, opts.merchantOwnerUserId);
      if (chat.storeId !== store.id) {
        throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المحادثة');
      }
      return chat;
    }
    throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المحادثة');
  }

  async listMessages(chatId: string, opts: { consumerId?: string; merchantOwnerUserId?: string }) {
    await this.getChatForParticipant(chatId, opts);
    return this.prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: 'asc' } });
  }

  // يستخدمه endpoint رفع صورة الشات للتحقق أن المستخدم طرف في المحادثة قبل قبول الملف
  async assertParticipant(chatId: string, opts: { consumerId?: string; merchantOwnerUserId?: string }) {
    await this.getChatForParticipant(chatId, opts);
  }

  async sendMessage(
    chatId: string,
    senderType: SenderType,
    senderId: string,
    dto: SendMessageDto,
    opts: { consumerId?: string; merchantOwnerUserId?: string },
  ) {
    if (!dto.text && !dto.imageUrl) {
      throw new BadRequestException('الرسالة فارغة');
    }
    const chat = await this.getChatForParticipant(chatId, opts);

    if (senderType === 'consumer') {
      const latestSub = await this.prisma.subscription.findFirst({
        where: { storeId: chat.storeId },
        orderBy: { startDate: 'desc' },
      });
      assertStoreAvailable(chat.store.status, latestSub);
    }

    return this.prisma.message.create({
      data: { chatId, senderType, senderId, text: dto.text, imageUrl: dto.imageUrl },
    });
  }
}

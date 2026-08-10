import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketRelatedType, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAsConsumer(consumerId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: { relatedType: 'consumer', relatedId: consumerId, subject: dto.subject },
    });
  }

  async createAsMerchant(ownerUserId: string, dto: CreateTicketDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.supportTicket.create({
      data: { relatedType: 'store', relatedId: store.id, subject: dto.subject },
    });
  }

  list(status?: TicketStatus, relatedType?: TicketRelatedType) {
    return this.prisma.supportTicket.findMany({
      where: { status, relatedType },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMineAsConsumer(consumerId: string) {
    return this.prisma.supportTicket.findMany({
      where: { relatedType: 'consumer', relatedId: consumerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMineAsMerchant(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.supportTicket.findMany({
      where: { relatedType: 'store', relatedId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');
    return this.prisma.supportTicket.update({ where: { id }, data: { status } });
  }
}

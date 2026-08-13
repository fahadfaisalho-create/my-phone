import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateDeliveryAgentDto } from './dto/create-delivery-agent.dto';
import { UpdateDeliveryAgentDto } from './dto/update-delivery-agent.dto';

@Injectable()
export class DeliveryAgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.deliveryAgent.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerUserId: string, dto: CreateDeliveryAgentDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.deliveryAgent.create({
      data: { storeId: store.id, name: dto.name, phone: dto.phone },
    });
  }

  private async findOwned(ownerUserId: string, agentId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { id: agentId } });
    if (!agent || agent.storeId !== store.id) {
      throw new NotFoundException('المندوب غير موجود');
    }
    return agent;
  }

  async update(ownerUserId: string, agentId: string, dto: UpdateDeliveryAgentDto) {
    await this.findOwned(ownerUserId, agentId);
    return this.prisma.deliveryAgent.update({ where: { id: agentId }, data: dto });
  }

  async remove(ownerUserId: string, agentId: string) {
    await this.findOwned(ownerUserId, agentId);
    await this.prisma.deliveryAgent.delete({ where: { id: agentId } });
    return { success: true };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(storeId: string) {
    return this.prisma.service.findMany({ where: { storeId } });
  }

  async listMine(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.list(store.id);
  }

  private async assertLinkedProductBelongs(storeId: string, linkedProductId?: string | null) {
    if (!linkedProductId) return;
    const product = await this.prisma.product.findUnique({ where: { id: linkedProductId } });
    if (!product || product.storeId !== storeId) {
      throw new BadRequestException('قطعة الغيار المختارة لا تنتمي لهذا المحل');
    }
  }

  async create(ownerUserId: string, dto: CreateServiceDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    await this.assertLinkedProductBelongs(store.id, dto.linkedProductId);
    return this.prisma.service.create({
      data: {
        storeId: store.id,
        name: dto.name,
        deviceSupport: dto.deviceSupport ?? 'all',
        laborPrice: dto.laborPrice ?? 0,
        linkedProductId: dto.linkedProductId || null,
      },
    });
  }

  private async findOwned(ownerUserId: string, serviceId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.storeId !== store.id) {
      throw new NotFoundException('الخدمة غير موجودة');
    }
    return { store, service };
  }

  async update(ownerUserId: string, serviceId: string, dto: UpdateServiceDto) {
    const { store } = await this.findOwned(ownerUserId, serviceId);
    if (dto.linkedProductId !== undefined) {
      await this.assertLinkedProductBelongs(store.id, dto.linkedProductId);
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        deviceSupport: dto.deviceSupport,
        laborPrice: dto.laborPrice,
        linkedProductId: dto.linkedProductId === undefined ? undefined : dto.linkedProductId || null,
      },
    });
  }

  async remove(ownerUserId: string, serviceId: string) {
    await this.findOwned(ownerUserId, serviceId);
    await this.prisma.service.delete({ where: { id: serviceId } });
    return { success: true };
  }
}

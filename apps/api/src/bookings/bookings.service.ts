import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { assertStoreAvailable } from '../common/store-availability.util';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(consumerId: string, dto: CreateBookingDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');
    assertStoreAvailable(store.status, store.subscriptions[0] ?? null);

    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service || service.storeId !== store.id) {
      throw new BadRequestException('الخدمة غير تابعة لهذا المحل');
    }
    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch || branch.storeId !== store.id) {
      throw new BadRequestException('الفرع غير تابع لهذا المحل');
    }

    return this.prisma.booking.create({
      data: {
        consumerId,
        storeId: store.id,
        serviceId: service.id,
        branchId: branch.id,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'pending',
      },
    });
  }

  listMine(consumerId: string) {
    return this.prisma.booking.findMany({
      where: { consumerId },
      orderBy: { scheduledAt: 'desc' },
      include: { store: { select: { name: true } }, service: true, branch: true },
    });
  }

  async listForMyStore(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.booking.findMany({
      where: { storeId: store.id },
      orderBy: { scheduledAt: 'desc' },
      include: { consumer: { select: { name: true, phone: true } }, service: true, branch: true },
    });
  }

  async updateStatus(ownerUserId: string, bookingId: string, status: BookingStatus) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.storeId !== store.id) {
      throw new NotFoundException('الحجز غير موجود');
    }
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new ForbiddenException('لا يمكن تعديل حجز منتهٍ أو ملغى');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}

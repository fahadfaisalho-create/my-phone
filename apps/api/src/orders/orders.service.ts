import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { assertStoreAvailable } from '../common/store-availability.util';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(consumerId: string, dto: CreateOrderDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');
    assertStoreAvailable(store.status, store.subscriptions[0] ?? null);

    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const itemsData: { productId: string; qty: number; price: number }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.storeId !== store.id) {
          throw new BadRequestException(`المنتج ${item.productId} لا ينتمي لهذا المحل`);
        }
        if (product.quantity < item.qty) {
          throw new BadRequestException(`الكمية المتوفرة من "${product.name}" غير كافية`);
        }
        const price = Number(product.price);
        total += price * item.qty;
        itemsData.push({ productId: product.id, qty: item.qty, price });
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.qty } },
        });
      }

      return tx.order.create({
        data: {
          consumerId,
          storeId: store.id,
          total,
          status: 'pending',
          paymentStatus: 'unpaid',
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  listMine(consumerId: string) {
    return this.prisma.order.findMany({
      where: { consumerId },
      orderBy: { id: 'desc' },
      include: { items: { include: { product: true } }, store: { select: { name: true } } },
    });
  }

  private async findOwnedByConsumer(consumerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.consumerId !== consumerId) {
      throw new NotFoundException('الطلب غير موجود');
    }
    return order;
  }

  // محاكاة تأكيد الدفع (بوابة الدفع الفعلية غير مربوطة بعد) — بنفس نمط تفعيل اشتراك المحل
  async confirmPayment(consumerId: string, orderId: string) {
    const order = await this.findOwnedByConsumer(consumerId, orderId);
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('تم دفع هذا الطلب مسبقاً');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid' },
    });
  }

  async listForMyStore(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { id: 'desc' },
      include: { items: { include: { product: true } }, consumer: { select: { name: true, phone: true } } },
    });
  }

  async updateStatus(ownerUserId: string, orderId: string, status: OrderStatus) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) {
      throw new NotFoundException('الطلب غير موجود');
    }
    return this.prisma.order.update({ where: { id: orderId }, data: { status } });
  }
}

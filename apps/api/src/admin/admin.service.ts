import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listStores(status?: StoreStatus) {
    return this.prisma.store.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
      },
    });
  }

  async approveStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن قبول طلب ليس قيد المراجعة');
    }
    return this.prisma.store.update({
      where: { id },
      data: { status: 'active', rejectionReason: null },
    });
  }

  async rejectStore(id: string, reason: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن رفض طلب ليس قيد المراجعة');
    }
    return this.prisma.store.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
      // TODO: عند ربط خدمة البريد، يُرسل بريد للتاجر بالسبب هنا (حسب قاعدة العمل المحسومة)
    });
  }

  // تأكيد/إلغاء تأكيد استلام دفع فاتورة الاشتراك يدوياً من الإدمن
  // (بديل مؤقت لحد ربط بوابة دفع فعلية — مطابق لملاحظة "الدفع يُحدَّد لاحقاً" في المواصفات)
  async setSubscriptionPaid(subscriptionId: string, paid: boolean) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new NotFoundException('الاشتراك غير موجود');
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { paidAt: paid ? new Date() : null },
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreStatus, TechnicianStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

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
    const store = await this.prisma.store.findUnique({ where: { id }, include: { owner: true } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن قبول طلب ليس قيد المراجعة');
    }
    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: 'active', rejectionReason: null, verifiedAt: new Date() },
    });
    if (store.owner.email) {
      this.mail.sendStoreApproval(store.owner.email, store.name).catch(() => undefined);
    }
    return updated;
  }

  async rejectStore(id: string, reason: string) {
    const store = await this.prisma.store.findUnique({ where: { id }, include: { owner: true } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'pending') {
      throw new BadRequestException('لا يمكن رفض طلب ليس قيد المراجعة');
    }
    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
    });
    // حسب قاعدة العمل المحسومة: عند الرفض يُرسل بريد بالسبب للتاجر
    if (store.owner.email) {
      this.mail.sendStoreRejection(store.owner.email, store.name, reason).catch(() => undefined);
    }
    return updated;
  }

  async suspendStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'active') {
      throw new BadRequestException('لا يمكن إيقاف محل ليس نشطاً');
    }
    return this.prisma.store.update({ where: { id }, data: { status: 'suspended' } });
  }

  async reactivateStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.status !== 'suspended') {
      throw new BadRequestException('لا يمكن إعادة تفعيل محل ليس موقوفاً');
    }
    return this.prisma.store.update({ where: { id }, data: { status: 'active' } });
  }

  // تقارير/إحصائيات عامة للإدمن: أعداد المحلات حسب الحالة، الطلبات، الحجوزات،
  // إيراد الاشتراكات والطلبات المدفوعة، وتذاكر الدعم حسب الحالة.
  async getStats() {
    const [
      storesByStatus,
      ordersCount,
      paidOrders,
      bookingsByStatus,
      paidSubscriptions,
      unpaidSubscriptions,
      ticketsByStatus,
      paidAds,
    ] = await Promise.all([
      this.prisma.store.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.count(),
      this.prisma.order.findMany({ where: { paymentStatus: 'paid' }, select: { total: true, paidAt: true } }),
      this.prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.subscription.findMany({ where: { paidAt: { not: null } }, select: { price: true, paidAt: true } }),
      this.prisma.subscription.count({ where: { paidAt: null } }),
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.storeAd.findMany({ where: { paidAt: { not: null } }, select: { totalPrice: true } }),
    ]);

    const countByKey = <K extends string>(rows: { status: K; _count: { _all: number } }[]) =>
      rows.reduce((acc, r) => ({ ...acc, [r.status]: r._count._all }), {} as Record<K, number>);

    const sum = (rows: { total?: unknown; price?: unknown }[], key: 'total' | 'price') =>
      rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

    // آخر 6 أشهر (شامل الشهر الحالي) — إيراد فعلي محسوب من تواريخ الدفع
    // الحقيقية (paidAt)، بدون أي تقدير أو رقم وهمي
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleDateString('ar-SA', { month: 'long' }) });
    }
    const revenueByMonth = new Map(months.map((m) => [m.key, { subscriptions: 0, orders: 0 }]));
    for (const s of paidSubscriptions) {
      if (!s.paidAt) continue;
      const bucket = revenueByMonth.get(monthKey(s.paidAt));
      if (bucket) bucket.subscriptions += Number(s.price);
    }
    for (const o of paidOrders) {
      if (!o.paidAt) continue;
      const bucket = revenueByMonth.get(monthKey(o.paidAt));
      if (bucket) bucket.orders += Number(o.total);
    }
    const monthlyRevenue = months.map((m) => ({
      month: m.label,
      subscriptions: revenueByMonth.get(m.key)!.subscriptions,
      orders: revenueByMonth.get(m.key)!.orders,
    }));

    return {
      stores: countByKey(storesByStatus as any),
      orders: { total: ordersCount, paidCount: paidOrders.length, paidRevenue: sum(paidOrders, 'total') },
      bookings: countByKey(bookingsByStatus as any),
      subscriptions: {
        paidCount: paidSubscriptions.length,
        paidRevenue: sum(paidSubscriptions, 'price'),
        unpaidCount: unpaidSubscriptions,
      },
      monthlyRevenue,
      supportTickets: countByKey(ticketsByStatus as any),
      ads: {
        paidCount: paidAds.length,
        paidRevenue: paidAds.reduce((acc, r) => acc + Number(r.totalPrice ?? 0), 0),
      },
    };
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

  // مراجعة رخصة العمل الحر للفنيين اللي تضيفهم المحلات — تحقق يدوي مؤقت
  // (بديل لحد ربط فعلي مستقبلي مع منصة العمل الحر)
  listTechnicians(status?: TechnicianStatus) {
    return this.prisma.technician.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, providerType: true } },
      },
    });
  }

  async approveTechnician(id: string) {
    const technician = await this.prisma.technician.findUnique({ where: { id } });
    if (!technician) throw new NotFoundException('الفني غير موجود');
    if (technician.status !== 'pending') {
      throw new BadRequestException('لا يمكن قبول طلب ليس قيد المراجعة');
    }
    return this.prisma.technician.update({
      where: { id },
      data: { status: 'approved', rejectionReason: null, verifiedAt: new Date() },
    });
  }

  async rejectTechnician(id: string, reason: string) {
    const technician = await this.prisma.technician.findUnique({ where: { id } });
    if (!technician) throw new NotFoundException('الفني غير موجود');
    if (technician.status !== 'pending') {
      throw new BadRequestException('لا يمكن رفض طلب ليس قيد المراجعة');
    }
    return this.prisma.technician.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
    });
  }
}

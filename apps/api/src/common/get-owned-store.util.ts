import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// يجلب محل التاجر الحالي مع التأكد أنه غير موقوف — تُستخدم في كل الوحدات
// التي يديرها التاجر (فروع/خدمات/منتجات...)
export async function getOwnedStoreOrThrow(prisma: PrismaService, ownerUserId: string) {
  const store = await prisma.store.findFirst({ where: { ownerUserId } });
  if (!store) throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
  if (store.status === 'suspended') {
    throw new ForbiddenException('الحساب موقوف — تواصل مع الدعم');
  }
  return store;
}

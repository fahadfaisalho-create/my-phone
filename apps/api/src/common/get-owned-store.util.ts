import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// يجلب محل التاجر الحالي مع التأكد أنه غير موقوف — تُستخدم في كل الوحدات
// التي يديرها التاجر (فروع/خدمات/منتجات...). userId قد يكون صاحب المحل
// (merchant_rep) نفسه، أو حساباً فرعياً (employee) تابعاً له — بنفس التوقيع
// القديم بالضبط حتى ما نحتاج نلمس كل نداء بكل الوحدات؛ صلاحيات القسم
// المحدد (أي تبويب يقدر الموظف يوصله) تُتحقّق بشكل منفصل عبر RequireSectionGuard.
export async function getOwnedStoreOrThrow(prisma: PrismaService, userId: string) {
  const ownedStore = await prisma.store.findFirst({ where: { ownerUserId: userId } });
  if (ownedStore) {
    if (ownedStore.status === 'suspended') {
      throw new ForbiddenException('الحساب موقوف — تواصل مع الدعم');
    }
    return ownedStore;
  }

  const employeeProfile = await prisma.employeeProfile.findUnique({
    where: { userId },
    include: { store: true },
  });
  if (employeeProfile && employeeProfile.active) {
    if (employeeProfile.store.status === 'suspended') {
      throw new ForbiddenException('الحساب موقوف — تواصل مع الدعم');
    }
    return employeeProfile.store;
  }

  throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
}

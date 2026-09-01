import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

// كلمة سر عشوائية للحساب الفرعي — تُرجع نصاً صريحاً مرة واحدة فقط وقت
// الإنشاء (نفس نمط بيانات الدخول المُولَّدة بمنصات أخرى بالنظام) ليبلّغها
// صاحب المحل للموظف يدوياً؛ لا تُخزَّن ولا تُرجَع بعد ذلك أبداً
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[bytes[i] % chars.length];
  return pw + '@1';
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // ملاحظة: هذه الخدمة تُستدعى فقط من EmployeesController المقفل على
  // @Roles('merchant_rep') — فلا حساب فرعي يقدر يوصلها أصلاً، ما يحتاج
  // تحقق إضافي غير كونه صاحب محل فعلي (getOwnedStoreOrThrow نفسها)
  async create(ownerUserId: string, dto: CreateEmployeeDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);

    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) throw new BadRequestException('رقم الجوال مستخدم مسبقاً');
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new BadRequestException('البريد الإلكتروني مستخدم مسبقاً');

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: 'employee',
          name: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
          phone: dto.phone.trim(),
          email: dto.email?.trim() || null,
          passwordHash,
        },
      });
      return tx.employeeProfile.create({
        data: {
          userId: user.id,
          storeId: store.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          nationalId: dto.nationalId.trim(),
          birthDate: new Date(dto.birthDate),
          permissions: dto.permissions ?? [],
          attendanceLat: dto.attendanceLat ?? null,
          attendanceLng: dto.attendanceLng ?? null,
          attendanceRadiusM: dto.attendanceRadiusM ?? null,
        },
        include: { user: { select: { phone: true, email: true, name: true } } },
      });
    });

    return { ...employee, temporaryPassword: password };
  }

  async listMine(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.employeeProfile.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { phone: true, email: true } } },
    });
  }

  async update(ownerUserId: string, id: string, dto: UpdateEmployeeDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const employee = await this.prisma.employeeProfile.findUnique({ where: { id } });
    if (!employee || employee.storeId !== store.id) throw new NotFoundException('الموظف غير موجود');

    return this.prisma.employeeProfile.update({
      where: { id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        nationalId: dto.nationalId?.trim(),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        permissions: dto.permissions,
        active: dto.active,
        attendanceLat: dto.attendanceLat,
        attendanceLng: dto.attendanceLng,
        attendanceRadiusM: dto.attendanceRadiusM,
      },
    });
  }

  async remove(ownerUserId: string, id: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const employee = await this.prisma.employeeProfile.findUnique({ where: { id } });
    if (!employee || employee.storeId !== store.id) throw new NotFoundException('الموظف غير موجود');
    await this.prisma.user.delete({ where: { id: employee.userId } }); // يكسح EmployeeProfile كاسكيد
    return { ok: true };
  }
}

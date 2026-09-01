import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { distanceKm } from '../common/geo.util';
import { CheckInOutDto } from './dto/check-inout.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMyProfile(userId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({ where: { userId } });
    if (!profile || !profile.active) throw new ForbiddenException('حسابك غير مفعّل');
    return profile;
  }

  // يتحقق أن الموظف داخل نطاق الحضور الجغرافي المحدد له بالضبط — بدون أي
  // استثناء أو تجاوز، تماماً كما وصف صاحب المحل الميزة
  private assertWithinZone(profile: { attendanceLat: number | null; attendanceLng: number | null; attendanceRadiusM: number | null }, lat: number, lng: number) {
    if (profile.attendanceLat === null || profile.attendanceLng === null || profile.attendanceRadiusM === null) {
      throw new BadRequestException('لم يحدد لك صاحب المحل نطاق حضور بعد — تواصل معه');
    }
    const distanceM = distanceKm(lat, lng, profile.attendanceLat, profile.attendanceLng) * 1000;
    if (distanceM > profile.attendanceRadiusM) {
      throw new ForbiddenException('موقعك خارج نطاق الحضور المحدد لك');
    }
  }

  async checkIn(userId: string, dto: CheckInOutDto) {
    const profile = await this.getMyProfile(userId);
    this.assertWithinZone(profile, dto.lat, dto.lng);

    const openRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId: profile.id, checkOutAt: null },
    });
    if (openRecord) throw new BadRequestException('سجّلت حضورك مسبقاً ولم تسجّل انصرافك بعد');

    return this.prisma.attendanceRecord.create({
      data: {
        employeeId: profile.id,
        checkInAt: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
      },
    });
  }

  async checkOut(userId: string, dto: CheckInOutDto) {
    const profile = await this.getMyProfile(userId);
    this.assertWithinZone(profile, dto.lat, dto.lng);

    const openRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId: profile.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (!openRecord) throw new BadRequestException('ما سجّلت حضورك بعد');

    return this.prisma.attendanceRecord.update({
      where: { id: openRecord.id },
      data: { checkOutAt: new Date(), checkOutLat: dto.lat, checkOutLng: dto.lng },
    });
  }

  async myStatus(userId: string) {
    const profile = await this.getMyProfile(userId);
    const openRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId: profile.id, checkOutAt: null },
    });
    const hasZone = profile.attendanceLat !== null && profile.attendanceLng !== null && profile.attendanceRadiusM !== null;
    return {
      checkedIn: !!openRecord,
      checkInAt: openRecord?.checkInAt ?? null,
      hasZone,
      zone: hasZone
        ? { lat: profile.attendanceLat, lng: profile.attendanceLng, radiusM: profile.attendanceRadiusM }
        : null,
    };
  }

  // --- لصاحب المحل: عرض/تصدير سجلات كل الموظفين ---

  async listForStore(ownerUserId: string, from?: string, to?: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const range = this.buildRange(from, to);
    return this.prisma.attendanceRecord.findMany({
      where: { employee: { storeId: store.id }, ...(range ? { checkInAt: range } : {}) },
      orderBy: { checkInAt: 'desc' },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  private buildRange(from?: string, to?: string) {
    if (!from && !to) return null;
    const range: { gte?: Date; lte?: Date } = {};
    if (from) range.gte = new Date(`${from}T00:00:00`);
    if (to) range.lte = new Date(`${to}T23:59:59`);
    return range;
  }
}

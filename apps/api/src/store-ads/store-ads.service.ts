import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { SettingsService } from '../settings/settings.service';
import { CreateStoreAdDto } from './dto/create-store-ad.dto';

@Injectable()
export class StoreAdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async getRate() {
    return { adDailyRate: await this.settingsService.getAdDailyRate() };
  }

  listMine(ownerUserId: string) {
    return getOwnedStoreOrThrow(this.prisma, ownerUserId).then((store) =>
      this.prisma.storeAd.findMany({ where: { storeId: store.id }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async create(ownerUserId: string, dto: CreateStoreAdDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const dailyRate = await this.settingsService.getAdDailyRate();
    return this.prisma.storeAd.create({
      data: {
        storeId: store.id,
        days: dto.days,
        dailyRate,
        totalPrice: dailyRate * dto.days,
      },
    });
  }

  // دفع ذاتي محاكى (بدون تدخل إدمن) — نفس نمط "ادفع الآن" بالطلبات والاشتراكات.
  // الإعلان يصير فعّالاً فوراً وتُحسب مدته من لحظة الدفع، لا من لحظة الشراء
  async confirmPayment(ownerUserId: string, adId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const ad = await this.prisma.storeAd.findUnique({ where: { id: adId } });
    if (!ad || ad.storeId !== store.id) throw new NotFoundException('الإعلان غير موجود');
    if (ad.paidAt) throw new BadRequestException('تم دفع هذا الإعلان مسبقاً');
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + ad.days);
    return this.prisma.storeAd.update({
      where: { id: adId },
      data: { paidAt: now, startsAt: now, expiresAt },
    });
  }
}

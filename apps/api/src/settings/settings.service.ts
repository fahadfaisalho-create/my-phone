import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// إعدادات عامة للمنصة — صف واحد ثابت (id: 'default'). نستخدم upsert بدل
// افتراض وجود الصف مسبقاً حتى تشتغل حتى لو انزرع بدونها بيئة قديمة
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
  }

  async getAdDailyRate(): Promise<number> {
    const settings = await this.getSettings();
    return Number(settings.adDailyRate);
  }

  updateAdDailyRate(rate: number) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { adDailyRate: rate },
      create: { id: 'default', adDailyRate: rate },
    });
  }

  updateSettings(data: {
    adDailyRate: number;
    platformLegalName?: string;
    platformVatNo?: string;
    platformCrNo?: string;
  }) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
  }
}

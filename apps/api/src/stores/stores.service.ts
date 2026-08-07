import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';

export interface UpdateStoreFiles {
  logo?: Express.Multer.File[];
  crFile?: Express.Multer.File[];
  bankFile?: Express.Multer.File[];
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(ownerUserId: string) {
    const store = await this.prisma.store.findFirst({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
      include: { subscriptions: { orderBy: { startDate: 'desc' }, take: 1 } },
    });
    if (!store) throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
    return store;
  }

  // تعديل بيانات المحل. إذا كان مرفوضاً سابقاً، تُعاد الحالة إلى "قيد المراجعة" تلقائياً
  // (حسب القاعدة: التاجر يعدّل ويعيد الإرسال دون بدء حساب جديد)
  async updateMine(ownerUserId: string, dto: UpdateStoreDto, files: UpdateStoreFiles) {
    const store = await this.prisma.store.findFirst({ where: { ownerUserId } });
    if (!store) throw new NotFoundException('لا يوجد محل مرتبط بهذا الحساب');
    if (store.status === 'suspended') {
      throw new ForbiddenException('الحساب موقوف — تواصل مع الدعم');
    }

    const logo = files.logo?.[0];
    const crFile = files.crFile?.[0];
    const bankFile = files.bankFile?.[0];
    const wasRejected = store.status === 'rejected';

    return this.prisma.store.update({
      where: { id: store.id },
      data: {
        name: dto.storeName ?? store.name,
        commercialRegisterNo: dto.commercialRegisterNo ?? store.commercialRegisterNo,
        taxNo: dto.taxNo ?? store.taxNo,
        iban: dto.iban ?? store.iban,
        logoUrl: logo ? `/uploads/logos/${logo.filename}` : store.logoUrl,
        crFileUrl: crFile ? `/uploads/cr/${crFile.filename}` : store.crFileUrl,
        bankCertificateFileUrl: bankFile
          ? `/uploads/bank/${bankFile.filename}`
          : store.bankCertificateFileUrl,
        ...(wasRejected ? { status: 'pending', rejectionReason: null } : {}),
      },
    });
  }
}

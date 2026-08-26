import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { RenameBranchDto } from './dto/rename-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.branch.findMany({ where: { storeId: store.id } });
  }

  async create(ownerUserId: string, dto: CreateBranchDto) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.prisma.branch.create({
      data: { storeId: store.id, name: dto.name, address: dto.address, lat: dto.lat, lng: dto.lng },
    });
  }

  private async findOwned(ownerUserId: string, branchId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.storeId !== store.id) {
      throw new NotFoundException('الفرع غير موجود');
    }
    return branch;
  }

  // الاسم فقط قابل للتعديل — الموقع (العنوان/الإحداثيات) يبقى كما أُنشئ به الفرع
  async rename(ownerUserId: string, branchId: string, dto: RenameBranchDto) {
    await this.findOwned(ownerUserId, branchId);
    return this.prisma.branch.update({ where: { id: branchId }, data: { name: dto.name } });
  }

  async remove(ownerUserId: string, branchId: string) {
    await this.findOwned(ownerUserId, branchId);
    try {
      await this.prisma.branch.delete({ where: { id: branchId } });
    } catch {
      throw new ForbiddenException('لا يمكن حذف الفرع لوجود حجوزات مرتبطة به');
    }
    return { success: true };
  }
}

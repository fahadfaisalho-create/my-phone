import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOwnedStoreOrThrow } from '../common/get-owned-store.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  async listMine(ownerUserId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    return this.list(store.id);
  }

  // فرع فارغ = مشترك بين كل الفروع. لو مرسل، يتحقق أنه يتبع نفس المحل
  private async resolveBranchId(storeId: string, branchId?: string): Promise<string | null> {
    if (!branchId) return null;
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.storeId !== storeId) {
      throw new BadRequestException('الفرع غير موجود');
    }
    return branch.id;
  }

  async create(ownerUserId: string, dto: CreateProductDto, image?: Express.Multer.File) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    if (store.providerType === 'individual') {
      throw new BadRequestException('حسابات الفنيين المستقلين تقدّم خدمات فقط، بدون منتجات');
    }
    if (!image) {
      throw new BadRequestException('صورة المنتج مطلوبة');
    }
    const branchId = await this.resolveBranchId(store.id, dto.branchId);
    return this.prisma.product.create({
      data: {
        storeId: store.id,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        quantity: dto.quantity ?? 0,
        imageUrl: image ? `/uploads/products/${image.filename}` : null,
        branchId,
      },
    });
  }

  private async findOwned(ownerUserId: string, productId: string) {
    const store = await getOwnedStoreOrThrow(this.prisma, ownerUserId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== store.id) {
      throw new NotFoundException('المنتج غير موجود');
    }
    return product;
  }

  async update(
    ownerUserId: string,
    productId: string,
    dto: UpdateProductDto,
    image?: Express.Multer.File,
  ) {
    const product = await this.findOwned(ownerUserId, productId);
    // dto.branchId === '' يعني "رجّعه مشترك بين كل الفروع"، undefined يعني "بدون تغيير"
    const branchId =
      dto.branchId === undefined
        ? product.branchId
        : await this.resolveBranchId(product.storeId, dto.branchId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name ?? product.name,
        category: dto.category ?? product.category,
        description: dto.description ?? product.description,
        price: dto.price ?? product.price,
        imageUrl: image ? `/uploads/products/${image.filename}` : product.imageUrl,
        branchId,
      },
    });
  }

  async remove(ownerUserId: string, productId: string) {
    await this.findOwned(ownerUserId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return { success: true };
  }

  // تعديل الكمية فقط — صفحة المخزون
  async updateInventory(ownerUserId: string, productId: string, dto: UpdateInventoryDto) {
    const product = await this.findOwned(ownerUserId, productId);
    if (dto.delta === undefined && dto.quantity === undefined) {
      throw new BadRequestException('أرسل delta أو quantity');
    }
    const nextQty =
      dto.quantity !== undefined ? dto.quantity : Math.max(0, product.quantity + (dto.delta ?? 0));
    return this.prisma.product.update({
      where: { id: productId },
      data: { quantity: nextQty },
    });
  }
}

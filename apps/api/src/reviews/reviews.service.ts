import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(consumerId: string, storeId: string, dto: CreateReviewDto) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.status !== 'active') {
      throw new NotFoundException('المحل غير موجود');
    }
    return this.prisma.review.upsert({
      where: { consumerId_storeId: { consumerId, storeId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { consumerId, storeId, rating: dto.rating, comment: dto.comment },
    });
  }
}

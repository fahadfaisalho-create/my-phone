import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isStoreAvailable } from '../common/store-availability.util';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listStores(search?: string) {
    const stores = await this.prisma.store.findMany({
      where: {
        status: 'active',
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
        _count: { select: { services: true, products: true, reviews: true } },
      },
    });

    const ids = stores.map((s) => s.id);
    const ratings = ids.length
      ? await this.prisma.review.groupBy({
          by: ['storeId'],
          where: { storeId: { in: ids } },
          _avg: { rating: true },
        })
      : [];
    const ratingByStore = new Map(ratings.map((r) => [r.storeId, r._avg.rating]));

    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl,
      providerType: s.providerType,
      servicesCount: s._count.services,
      productsCount: s._count.products,
      reviewsCount: s._count.reviews,
      avgRating: ratingByStore.get(s.id) ?? null,
      available: isStoreAvailable(s.status, s.subscriptions[0] ?? null),
    }));
  }

  async listFeaturedStores() {
    const now = new Date();
    const stores = await this.prisma.store.findMany({
      where: {
        status: 'active',
        ads: { some: { paidAt: { not: null }, expiresAt: { gt: now } } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
        _count: { select: { services: true, products: true, reviews: true } },
      },
    });

    const ids = stores.map((s) => s.id);
    const ratings = ids.length
      ? await this.prisma.review.groupBy({
          by: ['storeId'],
          where: { storeId: { in: ids } },
          _avg: { rating: true },
        })
      : [];
    const ratingByStore = new Map(ratings.map((r) => [r.storeId, r._avg.rating]));

    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl,
      providerType: s.providerType,
      servicesCount: s._count.services,
      productsCount: s._count.products,
      reviewsCount: s._count.reviews,
      avgRating: ratingByStore.get(s.id) ?? null,
      available: isStoreAvailable(s.status, s.subscriptions[0] ?? null),
    }));
  }

  async getStore(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        branches: true,
        services: { include: { linkedProduct: true } },
        products: true,
        reviews: { orderBy: { createdAt: 'desc' }, take: 50 },
        subscriptions: { orderBy: { startDate: 'desc' }, take: 1 },
        technicians: { orderBy: { createdAt: 'asc' }, include: { certificates: { orderBy: { createdAt: 'asc' } } } },
      },
    });
    if (!store || store.status !== 'active') {
      throw new NotFoundException('المحل غير موجود');
    }
    const avg = store.reviews.length
      ? store.reviews.reduce((a, r) => a + r.rating, 0) / store.reviews.length
      : null;

    return {
      id: store.id,
      name: store.name,
      logoUrl: store.logoUrl,
      providerType: store.providerType,
      idVerified: !!store.nationalId,
      branches: store.branches,
      services: store.services,
      products: store.products,
      reviews: store.reviews,
      technicians: store.technicians,
      supportsDelivery: store.supportsDelivery,
      deliveryFee: store.deliveryFee,
      supportsAgentDelivery: store.supportsAgentDelivery,
      agentDeliveryFee: store.agentDeliveryFee,
      agentZoneLat: store.agentZoneLat,
      agentZoneLng: store.agentZoneLng,
      agentZoneRadiusKm: store.agentZoneRadiusKm,
      avgRating: avg,
      reviewsCount: store.reviews.length,
      available: isStoreAvailable(store.status, store.subscriptions[0] ?? null),
    };
  }
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Counts {
  branches: number;
  services: number;
  products: number;
  chats: number;
  bookings: number;
  orders: number;
}

export default function StatsTab() {
  const { t } = useLocale();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      const [branches, services, products, chats, bookings, orders] = await Promise.all([
        apiFetch<unknown[]>('/stores/me/branches').catch(() => []),
        apiFetch<unknown[]>('/stores/me/services').catch(() => []),
        apiFetch<unknown[]>('/stores/me/products').catch(() => []),
        apiFetch<unknown[]>('/stores/me/chats').catch(() => []),
        apiFetch<unknown[]>('/stores/me/bookings').catch(() => []),
        apiFetch<unknown[]>('/stores/me/orders').catch(() => []),
      ]);
      setCounts({
        branches: branches.length,
        services: services.length,
        products: products.length,
        chats: chats.length,
        bookings: bookings.length,
        orders: orders.length,
      });
    })();
  }, []);

  if (!counts) return <div className="spinner-wrap">{t('common.loading')}</div>;

  const items: { v: number; l: string }[] = [
    { v: counts.branches, l: t('stats.branchesCount') },
    { v: counts.services, l: t('stats.servicesCount') },
    { v: counts.products, l: t('stats.productsCount') },
    { v: counts.chats, l: t('stats.chatsCount') },
    { v: counts.bookings, l: t('stats.bookingsCount') },
    { v: counts.orders, l: t('stats.ordersCount') },
  ];

  return (
    <div>
      <div className="hero-stat">
        <div>
          <div className="label">{t('stats.ordersCount')}</div>
          <div className="value">{counts.orders}</div>
        </div>
      </div>
      <div className="grid3">
        {items.map((it) => (
          <div className="metric" key={it.l}>
            <div className="v">{it.v}</div>
            <div className="l">{it.l}</div>
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: 14 }}>
        {t('stats.footnote')}
      </p>
    </div>
  );
}

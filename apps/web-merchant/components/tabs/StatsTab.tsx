'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Counts {
  branches: number;
  services: number;
  products: number;
  chats: number;
  bookings: number;
  orders: number;
}

export default function StatsTab() {
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

  if (!counts) return <div className="spinner-wrap">جارٍ التحميل...</div>;

  const items: { v: number; l: string }[] = [
    { v: counts.branches, l: 'عدد الفروع' },
    { v: counts.services, l: 'عدد الخدمات' },
    { v: counts.products, l: 'عدد المنتجات' },
    { v: counts.chats, l: 'عدد المحادثات' },
    { v: counts.bookings, l: 'عدد الحجوزات' },
    { v: counts.orders, l: 'عدد الطلبات' },
  ];

  return (
    <div>
      <div className="grid3">
        {items.map((it) => (
          <div className="metric" key={it.l}>
            <div className="v">{it.v}</div>
            <div className="l">{it.l}</div>
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: 14 }}>
        الأرقام هنا مأخوذة من بيانات فعلية على الـ API (فروع/خدمات/منتجات/محادثات/حجوزات/طلبات).
      </p>
    </div>
  );
}

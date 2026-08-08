'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearSession, getToken } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { Store } from '@/lib/types';
import Topbar from '@/components/Topbar';
import BranchesTab from '@/components/tabs/BranchesTab';
import ServicesTab from '@/components/tabs/ServicesTab';
import ProductsTab from '@/components/tabs/ProductsTab';
import InventoryTab from '@/components/tabs/InventoryTab';
import BookingsTab from '@/components/tabs/BookingsTab';
import OrdersTab from '@/components/tabs/OrdersTab';
import MessagesTab from '@/components/tabs/MessagesTab';
import StatsTab from '@/components/tabs/StatsTab';

const TABS = [
  { key: 'branches', label: 'الفروع' },
  { key: 'services', label: 'الخدمات' },
  { key: 'products', label: 'المنتجات' },
  { key: 'inventory', label: 'المخزون' },
  { key: 'bookings', label: 'الحجوزات' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'messages', label: 'الرسائل' },
  { key: 'stats', label: 'الإحصائيات' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function DashboardPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [tab, setTab] = useState<TabKey>('branches');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/entry');
      return;
    }
    (async () => {
      try {
        const s = await apiFetch<Store>('/stores/me');
        if (s.status !== 'active') {
          router.replace(routeForStatus(s.status));
          return;
        }
        setStore(s);
      } catch {
        router.replace('/entry');
      }
    })();
  }, [router]);

  function handleExit() {
    clearSession();
    router.replace('/entry');
  }

  if (!store) return <div className="app spinner-wrap">جارٍ التحميل...</div>;

  return (
    <div className="app">
      <Topbar title={store.name} roleLabel="لوحة التاجر" onExit={handleExit} />

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'branches' && <BranchesTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, clearSession, getToken } from '@/lib/api';
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
import SupportTab from '@/components/tabs/SupportTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import TechniciansTab from '@/components/tabs/TechniciansTab';

const TABS = [
  { key: 'branches', label: 'الفروع' },
  { key: 'services', label: 'الخدمات' },
  { key: 'products', label: 'المنتجات' },
  { key: 'inventory', label: 'المخزون' },
  { key: 'technicians', label: 'فريق الصيانة' },
  { key: 'bookings', label: 'الحجوزات' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'messages', label: 'الرسائل' },
  { key: 'stats', label: 'الإحصائيات' },
  { key: 'support', label: 'الدعم' },
  { key: 'settings', label: 'الإعدادات' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function DashboardPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [tab, setTab] = useState<TabKey>('branches');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  async function loadStore() {
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
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/entry');
      return;
    }
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function handleExit() {
    clearSession();
    router.replace('/entry');
  }

  async function handlePaySubscription() {
    setPaying(true);
    setPayError('');
    try {
      await apiFetch('/stores/me/subscription/confirm-payment', { method: 'POST' });
      await loadStore();
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'تعذّر تأكيد الدفع');
    } finally {
      setPaying(false);
    }
  }

  if (!store) return <div className="app spinner-wrap">جارٍ التحميل...</div>;

  const sub = store.subscriptions?.[0];

  return (
    <div className="app">
      <Topbar title={store.name} roleLabel="لوحة التاجر" onExit={handleExit} />

      {sub && !sub.paidAt && (
        <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span>
            فاتورة الاشتراك ({sub.price} ﷼) غير مدفوعة بعد. بوابة الدفع الفعلية غير مربوطة حالياً — هذا الزر يحاكي نجاح الدفع فوراً.
          </span>
          <button className="primary" onClick={handlePaySubscription} disabled={paying}>
            {paying ? 'جارٍ الدفع...' : 'ادفع الآن'}
          </button>
        </div>
      )}
      {payError && <div className="err">{payError}</div>}

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
      {tab === 'technicians' && <TechniciansTab />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'messages' && <MessagesTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'support' && <SupportTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

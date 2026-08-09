'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getToken, getUser } from '@/lib/api';
import Topbar from '@/components/Topbar';
import StoresSection from '@/components/StoresSection';
import OrdersPaymentTab from '@/components/OrdersPaymentTab';

type Section = 'stores' | 'orders';

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>('stores');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  function handleExit() {
    clearSession();
    router.replace('/login');
  }

  if (!ready) return null;

  return (
    <div className="app">
      <Topbar title="لوحة تحكم الإدارة" roleLabel="مدير" onExit={handleExit} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <span
          className={`chip ${section === 'stores' ? 'on' : ''}`}
          style={{ padding: '8px 18px', fontSize: 13 }}
          onClick={() => setSection('stores')}
        >
          طلبات التسجيل
        </span>
        <span
          className={`chip ${section === 'orders' ? 'on' : ''}`}
          style={{ padding: '8px 18px', fontSize: 13 }}
          onClick={() => setSection('orders')}
        >
          طلبات الشراء
        </span>
      </div>

      {section === 'stores' ? <StoresSection /> : <OrdersPaymentTab />}
    </div>
  );
}

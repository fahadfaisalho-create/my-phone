'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getToken, getUser } from '@/lib/api';
import Topbar from '@/components/Topbar';
import StoresSection from '@/components/StoresSection';
import OrdersPaymentTab from '@/components/OrdersPaymentTab';
import SupportTicketsSection from '@/components/SupportTicketsSection';

type Section = 'stores' | 'orders' | 'support';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'stores', label: 'طلبات التسجيل' },
  { key: 'orders', label: 'طلبات الشراء' },
  { key: 'support', label: 'تذاكر الدعم' },
];

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => (
          <span
            key={s.key}
            className={`chip ${section === s.key ? 'on' : ''}`}
            style={{ padding: '8px 18px', fontSize: 13 }}
            onClick={() => setSection(s.key)}
          >
            {s.label}
          </span>
        ))}
      </div>

      {section === 'stores' && <StoresSection />}
      {section === 'orders' && <OrdersPaymentTab />}
      {section === 'support' && <SupportTicketsSection />}
    </div>
  );
}

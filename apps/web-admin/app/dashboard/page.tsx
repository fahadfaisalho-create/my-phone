'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getToken, getUser } from '@/lib/api';
import Topbar from '@/components/Topbar';
import StoresSection from '@/components/StoresSection';
import OrdersPaymentTab from '@/components/OrdersPaymentTab';
import SupportTicketsSection from '@/components/SupportTicketsSection';
import ReportsSection from '@/components/ReportsSection';
import CouponsSection from '@/components/CouponsSection';
import AdSettingsSection from '@/components/AdSettingsSection';
import { useLocale } from '@/lib/i18n';

type Section = 'stores' | 'orders' | 'support' | 'reports' | 'coupons' | 'ads';

const SECTION_KEYS: { key: Section; navKey: string }[] = [
  { key: 'stores', navKey: 'nav.stores' },
  { key: 'orders', navKey: 'nav.orders' },
  { key: 'coupons', navKey: 'nav.coupons' },
  { key: 'ads', navKey: 'nav.ads' },
  { key: 'support', navKey: 'nav.support' },
  { key: 'reports', navKey: 'nav.reports' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
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
      <Topbar title={t('dashboard.title')} roleLabel={t('dashboard.role')} onExit={handleExit} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {SECTION_KEYS.map((s) => (
          <span
            key={s.key}
            className={`chip ${section === s.key ? 'on' : ''}`}
            style={{ padding: '8px 18px', fontSize: 13 }}
            onClick={() => setSection(s.key)}
          >
            {t(s.navKey)}
          </span>
        ))}
      </div>

      {section === 'stores' && <StoresSection />}
      {section === 'orders' && <OrdersPaymentTab />}
      {section === 'coupons' && <CouponsSection />}
      {section === 'ads' && <AdSettingsSection />}
      {section === 'support' && <SupportTicketsSection />}
      {section === 'reports' && <ReportsSection />}
    </div>
  );
}

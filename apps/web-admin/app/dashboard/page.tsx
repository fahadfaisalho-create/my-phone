'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getToken, getUser } from '@/lib/api';
import Sidebar, { SidebarGroup } from '@/components/Sidebar';
import StoresSection from '@/components/StoresSection';
import OrdersPaymentTab from '@/components/OrdersPaymentTab';
import TaxInvoicesSection from '@/components/TaxInvoicesSection';
import SupportTicketsSection from '@/components/SupportTicketsSection';
import ReportsSection from '@/components/ReportsSection';
import CouponsSection from '@/components/CouponsSection';
import AdSettingsSection from '@/components/AdSettingsSection';
import { useLocale } from '@/lib/i18n';

type Section = 'stores' | 'orders' | 'invoices' | 'support' | 'reports' | 'coupons' | 'ads';

const SECTION_TITLES: Record<Section, string> = {
  stores: 'nav.stores',
  orders: 'nav.orders',
  invoices: 'nav.invoices',
  coupons: 'nav.coupons',
  ads: 'nav.ads',
  support: 'nav.support',
  reports: 'nav.reports',
};

export default function DashboardPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>('stores');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    setUserName(user.name);
    setReady(true);
  }, [router]);

  function handleExit() {
    clearSession();
    router.replace('/login');
  }

  if (!ready) return null;

  const groups: SidebarGroup[] = [
    {
      label: t('nav.groupContent'),
      items: [
        { key: 'stores', icon: 'stores', label: t('nav.stores') },
        { key: 'orders', icon: 'orders', label: t('nav.orders') },
        { key: 'invoices', icon: 'invoices', label: t('nav.invoices') },
      ],
    },
    {
      label: t('nav.groupManagement'),
      items: [
        { key: 'coupons', icon: 'coupons', label: t('nav.coupons') },
        { key: 'ads', icon: 'ads', label: t('nav.ads') },
        { key: 'support', icon: 'support', label: t('nav.support') },
      ],
    },
    {
      label: t('nav.groupAnalytics'),
      items: [{ key: 'reports', icon: 'reports', label: t('nav.reports') }],
    },
  ];

  return (
    <div className="shell">
      <Sidebar
        brandTitle="My Phone"
        brandSubtitle={t('dashboard.sidebarSubtitle')}
        groups={groups}
        activeKey={section}
        onSelect={(key) => setSection(key as Section)}
        userName={userName}
        roleLabel={t('dashboard.role')}
        onExit={handleExit}
      />

      <div className="shell-main">
        <div className="content-header">
          <div>
            <h1>{t(SECTION_TITLES[section])}</h1>
          </div>
          <button type="button" className="lang-btn" onClick={toggleLocale} aria-label="Toggle language">
            🌐
          </button>
        </div>

        {section === 'stores' && <StoresSection />}
        {section === 'orders' && <OrdersPaymentTab />}
        {section === 'invoices' && <TaxInvoicesSection />}
        {section === 'coupons' && <CouponsSection />}
        {section === 'ads' && <AdSettingsSection />}
        {section === 'support' && <SupportTicketsSection />}
        {section === 'reports' && <ReportsSection />}
      </div>
    </div>
  );
}

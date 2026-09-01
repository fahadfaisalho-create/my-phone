'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearSession, getToken, getUser } from '@/lib/api';
import { Store, StoreSection } from '@/lib/types';
import Sidebar, { SidebarGroup } from '@/components/Sidebar';
import AttendanceWidget from '@/components/AttendanceWidget';
import BranchesTab from '@/components/tabs/BranchesTab';
import ServicesTab from '@/components/tabs/ServicesTab';
import ProductsTab from '@/components/tabs/ProductsTab';
import InventoryTab from '@/components/tabs/InventoryTab';
import BookingsTab from '@/components/tabs/BookingsTab';
import OrdersTab from '@/components/tabs/OrdersTab';
import TaxInvoicesTab from '@/components/tabs/TaxInvoicesTab';
import MessagesTab from '@/components/tabs/MessagesTab';
import StatsTab from '@/components/tabs/StatsTab';
import SupportTab from '@/components/tabs/SupportTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import TechniciansTab from '@/components/tabs/TechniciansTab';
import CouponsTab from '@/components/tabs/CouponsTab';
import AdsTab from '@/components/tabs/AdsTab';
import { useLocale } from '@/lib/i18n';

const PERMISSIONS_KEY = 'employee_permissions';

const ALL_TABS = [
  { key: 'branches' as const, navKey: 'nav.branches', icon: 'branches' as const },
  { key: 'technicians' as const, navKey: 'nav.technicians', icon: 'technicians' as const },
  { key: 'services' as const, navKey: 'nav.services', icon: 'services' as const },
  { key: 'products' as const, navKey: 'nav.products', icon: 'products' as const },
  { key: 'inventory' as const, navKey: 'nav.inventory', icon: 'inventory' as const },
  { key: 'bookings' as const, navKey: 'nav.bookings', icon: 'bookings' as const },
  { key: 'orders' as const, navKey: 'nav.orders', icon: 'orders' as const },
  { key: 'taxInvoices' as const, navKey: 'nav.taxInvoices', icon: 'taxInvoices' as const },
  { key: 'coupons' as const, navKey: 'nav.coupons', icon: 'coupons' as const },
  { key: 'ads' as const, navKey: 'nav.ads', icon: 'ads' as const },
  { key: 'messages' as const, navKey: 'nav.messages', icon: 'messages' as const },
  { key: 'stats' as const, navKey: 'nav.stats', icon: 'stats' as const },
  { key: 'support' as const, navKey: 'nav.support', icon: 'support' as const },
  { key: 'settings' as const, navKey: 'nav.settings', icon: 'settings' as const },
];

type TabKey = StoreSection;

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [store, setStore] = useState<Store | null>(null);
  const [permissions, setPermissions] = useState<StoreSection[]>([]);
  const [userName, setUserName] = useState('');
  const [tab, setTab] = useState<TabKey | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== 'employee') {
      router.replace('/employee/login');
      return;
    }
    let perms: StoreSection[] = [];
    try {
      perms = JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]');
    } catch {
      perms = [];
    }
    setPermissions(perms);
    setUserName(user.name);
    setTab(perms[0] ?? null);

    (async () => {
      try {
        const s = await apiFetch<Store>('/stores/me');
        setStore(s);
      } catch {
        router.replace('/employee/login');
        return;
      }
      setReady(true);
    })();
  }, [router]);

  function handleExit() {
    clearSession();
    localStorage.removeItem(PERMISSIONS_KEY);
    router.replace('/employee/login');
  }

  if (!ready || !store) return <div className="app spinner-wrap">{t('dashboard.loading')}</div>;

  const visibleTabs = ALL_TABS.filter((tabDef) => permissions.includes(tabDef.key));
  const effectiveTab = tab && visibleTabs.some((v) => v.key === tab) ? tab : visibleTabs[0]?.key ?? null;

  const groups: SidebarGroup[] =
    visibleTabs.length > 0
      ? [{ label: t('nav.groupCore'), items: visibleTabs.map((v) => ({ key: v.key, icon: v.icon, label: t(v.navKey) })) }]
      : [];

  return (
    <div className="shell">
      <Sidebar
        brandTitle="My Phone"
        brandSubtitle={t('employeeDashboard.sidebarSubtitle')}
        groups={groups}
        activeKey={effectiveTab ?? ''}
        onSelect={(key) => setTab(key as TabKey)}
        userName={userName}
        roleLabel={store.name}
        onExit={handleExit}
      />

      <div className="shell-main">
        <div className="content-header">
          <div>
            <h1>{effectiveTab ? t(ALL_TABS.find((v) => v.key === effectiveTab)!.navKey) : t('employeeDashboard.noAccess')}</h1>
            <div className="subtitle">{store.name}</div>
          </div>
        </div>

        <AttendanceWidget />

        {visibleTabs.length === 0 && (
          <div className="card">
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('employeeDashboard.noAccessNote')}</p>
          </div>
        )}

        {effectiveTab === 'branches' && <BranchesTab />}
        {effectiveTab === 'services' && <ServicesTab />}
        {effectiveTab === 'products' && <ProductsTab />}
        {effectiveTab === 'inventory' && <InventoryTab />}
        {effectiveTab === 'technicians' && <TechniciansTab />}
        {effectiveTab === 'bookings' && <BookingsTab />}
        {effectiveTab === 'orders' && <OrdersTab />}
        {effectiveTab === 'taxInvoices' && <TaxInvoicesTab />}
        {effectiveTab === 'coupons' && <CouponsTab />}
        {effectiveTab === 'ads' && <AdsTab />}
        {effectiveTab === 'messages' && <MessagesTab />}
        {effectiveTab === 'stats' && <StatsTab />}
        {effectiveTab === 'support' && <SupportTab />}
        {effectiveTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

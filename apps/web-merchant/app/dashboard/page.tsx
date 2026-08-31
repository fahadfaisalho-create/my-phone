'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, clearSession, getToken, getUser } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { Store } from '@/lib/types';
import Sidebar, { SidebarGroup } from '@/components/Sidebar';
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

const TABS = [
  { key: 'branches', navKey: 'nav.branches', icon: 'branches' },
  { key: 'technicians', navKey: 'nav.technicians', icon: 'technicians' },
  { key: 'services', navKey: 'nav.services', icon: 'services' },
  { key: 'products', navKey: 'nav.products', icon: 'products' },
  { key: 'inventory', navKey: 'nav.inventory', icon: 'inventory' },
  { key: 'bookings', navKey: 'nav.bookings', icon: 'bookings' },
  { key: 'orders', navKey: 'nav.orders', icon: 'orders' },
  { key: 'taxInvoices', navKey: 'nav.taxInvoices', icon: 'taxInvoices' },
  { key: 'coupons', navKey: 'nav.coupons', icon: 'coupons' },
  { key: 'ads', navKey: 'nav.ads', icon: 'ads' },
  { key: 'messages', navKey: 'nav.messages', icon: 'messages' },
  { key: 'stats', navKey: 'nav.stats', icon: 'stats' },
  { key: 'support', navKey: 'nav.support', icon: 'support' },
  { key: 'settings', navKey: 'nav.settings', icon: 'settings' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// نفس تجميع القوائم بالشريط الجانبي بتصميم "الاتجاه أ"
const GROUP_KEYS: { label: string; keys: TabKey[] }[] = [
  { label: 'nav.groupCore', keys: ['branches', 'technicians', 'services', 'products', 'inventory'] },
  { label: 'nav.groupSales', keys: ['bookings', 'orders', 'taxInvoices', 'coupons', 'ads'] },
  { label: 'nav.groupOther', keys: ['messages', 'stats', 'support', 'settings'] },
];

// خطوات فتح لوحة التاجر تدريجياً: الفروع وفريق الصيانة متاحين من البداية،
// المنتجات تحتاج فرعاً واحداً على الأقل، المخزون وبقية الأقسام تحتاج منتجاً
// واحداً على الأقل، والخدمات تحتاج فرداً واحداً على الأقل بفريق الصيانة.
// يطبَّق فقط على حسابات المحلات (الشركات) — الفني المستقل ليس له هذا التدرج أصلاً.
const NEEDS_PRODUCT: TabKey[] = ['inventory', 'bookings', 'orders', 'taxInvoices', 'coupons', 'ads', 'messages', 'stats', 'support', 'settings'];

export default function DashboardPage() {
  const router = useRouter();
  const { t, tf } = useLocale();
  const [store, setStore] = useState<Store | null>(null);
  const [tab, setTab] = useState<TabKey>('branches');
  const [userName, setUserName] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [technicianCount, setTechnicianCount] = useState<number | null>(null);
  const [lockHint, setLockHint] = useState('');

  const loadUnlockCounts = useCallback(async () => {
    try {
      const [branches, products, technicians] = await Promise.all([
        apiFetch<unknown[]>('/stores/me/branches'),
        apiFetch<unknown[]>('/stores/me/products'),
        apiFetch<unknown[]>('/stores/me/technicians'),
      ]);
      setBranchCount(branches.length);
      setProductCount(products.length);
      setTechnicianCount(technicians.length);
    } catch {
      // فشل تحميل عدّادات الفتح التدريجي — يبقى كل شي مقفل احتياطاً لحد نجاح التحميل
    }
  }, []);

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
    setUserName(getUser()?.name ?? '');
    loadStore();
    loadUnlockCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // لو صار القسم الحالي مقفلاً بسبب تغيّر البيانات (مثلاً حذف آخر منتج وهو
  // بشاشة المخزون)، يرجّعه تلقائياً لأول قسم متاح بدل ما يبقى معلّقاً بمحتوى مقفل
  useEffect(() => {
    if (!store || store.providerType === 'individual') return;
    const needsProduct = NEEDS_PRODUCT.includes(tab);
    const currentlyLocked =
      (tab === 'products' && (branchCount ?? 0) === 0) ||
      (tab === 'services' && (technicianCount ?? 0) === 0) ||
      (needsProduct && (productCount ?? 0) === 0);
    if (currentlyLocked) setTab('branches');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchCount, productCount, technicianCount, store]);

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
      setPayError(err instanceof ApiError ? err.message : t('dashboard.paymentError'));
    } finally {
      setPaying(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess(false);
    try {
      await apiFetch('/stores/me/subscription/apply-coupon', {
        method: 'POST',
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      });
      setCouponCode('');
      setCouponSuccess(true);
      await loadStore();
    } catch (err) {
      setCouponError(err instanceof ApiError ? err.message : t('dashboard.couponError'));
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (!store) return <div className="app spinner-wrap">{t('dashboard.loading')}</div>;

  const sub = store.subscriptions?.[0];
  const isIndividual = store.providerType === 'individual';
  // الفني المستقل: بدون فروع متعددة أو منتجات/مخزون أو موظفين — خدمات شخصية فقط
  // (وبدون كوبونات — الكوبون يخصم من طلبات شراء المنتجات وهو ما عنده منتجات أصلاً)
  const HIDDEN_FOR_INDIVIDUAL: TabKey[] = ['branches', 'products', 'inventory', 'technicians', 'orders', 'taxInvoices', 'coupons'];
  const visibleTabs = isIndividual ? TABS.filter((tabDef) => !HIDDEN_FOR_INDIVIDUAL.includes(tabDef.key)) : TABS;
  const effectiveTab = visibleTabs.some((tabDef) => tabDef.key === tab) ? tab : visibleTabs[0].key;

  // خرائط القفل — لا تُطبَّق أبداً على حساب الفني المستقل
  const countsReady = branchCount !== null && productCount !== null && technicianCount !== null;
  function lockReason(key: TabKey): string | null {
    if (isIndividual || !countsReady) return null;
    if (key === 'products' && (branchCount ?? 0) === 0) return t('unlock.needBranch');
    if (key === 'services' && (technicianCount ?? 0) === 0) return t('unlock.needTechnician');
    if (NEEDS_PRODUCT.includes(key) && (productCount ?? 0) === 0) return t('unlock.needProduct');
    return null;
  }

  function handleTabClick(key: string) {
    const reason = lockReason(key as TabKey);
    if (reason) {
      setLockHint(reason);
      return;
    }
    setLockHint('');
    setTab(key as TabKey);
  }

  const groups: SidebarGroup[] = GROUP_KEYS.map((g) => ({
    label: t(g.label),
    items: g.keys
      .filter((key) => visibleTabs.some((v) => v.key === key))
      .map((key) => {
        const tabDef = TABS.find((v) => v.key === key)!;
        const reason = lockReason(key);
        return { key, icon: tabDef.icon, label: t(tabDef.navKey), locked: !!reason, lockTitle: reason ?? undefined };
      }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="shell">
      <Sidebar
        brandTitle="My Phone"
        brandSubtitle={isIndividual ? t('dashboard.roleIndividual') : t('dashboard.roleMerchant')}
        groups={groups}
        activeKey={effectiveTab}
        onSelect={handleTabClick}
        userName={userName}
        roleLabel={store.name}
        onExit={handleExit}
      />

      <div className="shell-main">
        <div className="content-header">
          <div>
            <h1>{t(TABS.find((v) => v.key === effectiveTab)!.navKey)}</h1>
            <div className="subtitle">{store.name}</div>
          </div>
        </div>

        {sub && !sub.paidAt && (
          <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span>
              {tf('dashboard.invoiceLine', sub.price)}
              {sub.discountAmount ? tf('dashboard.afterDiscount', sub.discountAmount) : ''}
              {sub.vatAmount ? tf('dashboard.vatIncluded', sub.vatAmount) : ''}
              {t('dashboard.invoiceUnpaidNote')}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!sub.couponId && (
                <>
                  <input
                    placeholder={t('dashboard.couponPlaceholder')}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ marginBottom: 0, width: 160 }}
                  />
                  <button className="secondary" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                    {applyingCoupon ? '...' : t('dashboard.apply')}
                  </button>
                </>
              )}
              <button className="primary" onClick={handlePaySubscription} disabled={paying}>
                {paying ? t('dashboard.paying') : t('dashboard.payNow')}
              </button>
            </div>
          </div>
        )}
        {couponError && <div className="err">{couponError}</div>}
        {couponSuccess && <div className="note" style={{ color: 'var(--ink)' }}>{t('dashboard.couponAppliedSuccess')}</div>}
        {payError && <div className="err">{payError}</div>}
        {lockHint && <div className="note" style={{ color: 'var(--amber, #8A5A0B)' }}>{lockHint}</div>}

        {effectiveTab === 'branches' && <BranchesTab onChanged={loadUnlockCounts} />}
        {effectiveTab === 'services' && <ServicesTab />}
        {effectiveTab === 'products' && <ProductsTab onChanged={loadUnlockCounts} />}
        {effectiveTab === 'inventory' && <InventoryTab />}
        {effectiveTab === 'technicians' && <TechniciansTab onChanged={loadUnlockCounts} />}
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

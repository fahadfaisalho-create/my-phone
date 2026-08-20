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
import CouponsTab from '@/components/tabs/CouponsTab';
import AdsTab from '@/components/tabs/AdsTab';
import { useLocale } from '@/lib/i18n';

const TABS = [
  { key: 'branches', navKey: 'nav.branches' },
  { key: 'services', navKey: 'nav.services' },
  { key: 'products', navKey: 'nav.products' },
  { key: 'inventory', navKey: 'nav.inventory' },
  { key: 'technicians', navKey: 'nav.technicians' },
  { key: 'bookings', navKey: 'nav.bookings' },
  { key: 'orders', navKey: 'nav.orders' },
  { key: 'coupons', navKey: 'nav.coupons' },
  { key: 'ads', navKey: 'nav.ads' },
  { key: 'messages', navKey: 'nav.messages' },
  { key: 'stats', navKey: 'nav.stats' },
  { key: 'support', navKey: 'nav.support' },
  { key: 'settings', navKey: 'nav.settings' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [store, setStore] = useState<Store | null>(null);
  const [tab, setTab] = useState<TabKey>('branches');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

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
      setCouponError(err instanceof ApiError ? err.message : 'تعذّر تطبيق الكوبون');
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (!store) return <div className="app spinner-wrap">جارٍ التحميل...</div>;

  const sub = store.subscriptions?.[0];
  // الفني المستقل: بدون فروع متعددة أو منتجات/مخزون أو موظفين — خدمات شخصية فقط
  // (وبدون كوبونات — الكوبون يخصم من طلبات شراء المنتجات وهو ما عنده منتجات أصلاً)
  const HIDDEN_FOR_INDIVIDUAL: TabKey[] = ['branches', 'products', 'inventory', 'technicians', 'orders', 'coupons'];
  const visibleTabs =
    store.providerType === 'individual' ? TABS.filter((t) => !HIDDEN_FOR_INDIVIDUAL.includes(t.key)) : TABS;
  const effectiveTab = visibleTabs.some((t) => t.key === tab) ? tab : visibleTabs[0].key;

  return (
    <div className="app">
      <Topbar
        title={store.name}
        roleLabel={store.providerType === 'individual' ? t('dashboard.roleIndividual') : t('dashboard.roleMerchant')}
        onExit={handleExit}
      />

      {sub && !sub.paidAt && (
        <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span>
            فاتورة الاشتراك ({sub.price} ﷼{sub.discountAmount ? ` بعد خصم ${sub.discountAmount} ﷼` : ''}
            {sub.vatAmount ? ` شاملة ضريبة القيمة المضافة ${sub.vatAmount} ﷼` : ''}) غير مدفوعة بعد. بوابة الدفع
            الفعلية غير مربوطة حالياً — هذا الزر يحاكي نجاح الدفع فوراً.
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!sub.couponId && (
              <>
                <input
                  placeholder="كود خصم (اختياري)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  style={{ marginBottom: 0, width: 160 }}
                />
                <button className="secondary" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                  {applyingCoupon ? '...' : 'تطبيق'}
                </button>
              </>
            )}
            <button className="primary" onClick={handlePaySubscription} disabled={paying}>
              {paying ? 'جارٍ الدفع...' : 'ادفع الآن'}
            </button>
          </div>
        </div>
      )}
      {couponError && <div className="err">{couponError}</div>}
      {couponSuccess && <div className="note" style={{ color: 'var(--ink)' }}>✓ تم تطبيق الكوبون على اشتراكك</div>}
      {payError && <div className="err">{payError}</div>}

      <div className="tabs">
        {visibleTabs.map((tabItem) => (
          <button key={tabItem.key} className={effectiveTab === tabItem.key ? 'on' : ''} onClick={() => setTab(tabItem.key)}>
            {t(tabItem.navKey)}
          </button>
        ))}
      </div>

      {effectiveTab === 'branches' && <BranchesTab />}
      {effectiveTab === 'services' && <ServicesTab />}
      {effectiveTab === 'products' && <ProductsTab />}
      {effectiveTab === 'inventory' && <InventoryTab />}
      {effectiveTab === 'technicians' && <TechniciansTab />}
      {effectiveTab === 'bookings' && <BookingsTab />}
      {effectiveTab === 'orders' && <OrdersTab />}
      {effectiveTab === 'coupons' && <CouponsTab />}
      {effectiveTab === 'ads' && <AdsTab />}
      {effectiveTab === 'messages' && <MessagesTab />}
      {effectiveTab === 'stats' && <StatsTab />}
      {effectiveTab === 'support' && <SupportTab />}
      {effectiveTab === 'settings' && <SettingsTab />}
    </div>
  );
}

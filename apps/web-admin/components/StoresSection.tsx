'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreRequest, StoreStatus } from '@/lib/types';
import StoreRequestCard, { BADGE_CLASS, BADGE_NAV_KEY } from '@/components/StoreRequestCard';
import { useLocale } from '@/lib/i18n';

const TAB_KEYS: { key: StoreStatus | 'all'; navKey: string }[] = [
  { key: 'pending', navKey: 'stores.tabPending' },
  { key: 'active', navKey: 'stores.tabActive' },
  { key: 'rejected', navKey: 'stores.tabRejected' },
  { key: 'suspended', navKey: 'stores.tabSuspended' },
  { key: 'all', navKey: 'common.all' },
];

export default function StoresSection() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [tab, setTab] = useState<StoreStatus | 'all'>('pending');
  const [stores, setStores] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<StoreRequest[]>(`/admin/stores${query}`);
      setStores(data);
      // يحافظ على العنصر المختار لو لسا موجود بالقائمة الجديدة (بعد تحديث الحالة
      // مثلاً)، وإلا يختار أول عنصر تلقائياً — بدل ما تبقى اللوحة فاضية
      setSelectedId((prev) => (prev && data.some((s) => s.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('stores.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = stores.find((s) => s.id === selectedId) ?? null;

  async function handleApprove(id: string) {
    await apiFetch(`/admin/stores/${id}/approve`, { method: 'PATCH' });
    await load();
  }

  async function handleReject(id: string, reason: string) {
    await apiFetch(`/admin/stores/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    await load();
  }

  async function handleTogglePayment(subscriptionId: string, paid: boolean) {
    await apiFetch(`/admin/subscriptions/${subscriptionId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paid }),
    });
    await load();
  }

  async function handleSuspend(id: string) {
    await apiFetch(`/admin/stores/${id}/suspend`, { method: 'PATCH' });
    await load();
  }

  async function handleReactivate(id: string) {
    await apiFetch(`/admin/stores/${id}/reactivate`, { method: 'PATCH' });
    await load();
  }

  return (
    <div>
      <div className="tabs">
        {TAB_KEYS.map((tabItem) => (
          <button key={tabItem.key} className={tab === tabItem.key ? 'on' : ''} onClick={() => setTab(tabItem.key)}>
            {t(tabItem.navKey)}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('stores.heading')} {!loading && `(${stores.length})`}
      </h3>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : stores.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('stores.empty')}</p>
        </div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('stores.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{stores.length}</span>
            </div>
            <div className="split-list-body">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className={`split-list-item ${s.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{s.name}</b>
                    <span className={`badge ${BADGE_CLASS[s.status]}`}>{t(BADGE_NAV_KEY[s.status])}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {s.owner.name} · {s.providerType === 'individual' ? t('stores.individual') : t('stores.company')} ·{' '}
                    {new Date(s.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail">
              <StoreRequestCard
                store={selected}
                onApprove={handleApprove}
                onReject={handleReject}
                onTogglePayment={handleTogglePayment}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
              />
            </div>
          ) : (
            <div className="split-empty">{t('stores.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

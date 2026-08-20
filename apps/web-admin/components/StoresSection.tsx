'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreRequest, StoreStatus } from '@/lib/types';
import StoreRequestCard from '@/components/StoreRequestCard';
import { useLocale } from '@/lib/i18n';

const TAB_KEYS: { key: StoreStatus | 'all'; navKey: string }[] = [
  { key: 'pending', navKey: 'stores.tabPending' },
  { key: 'active', navKey: 'stores.tabActive' },
  { key: 'rejected', navKey: 'stores.tabRejected' },
  { key: 'suspended', navKey: 'stores.tabSuspended' },
  { key: 'all', navKey: 'common.all' },
];

export default function StoresSection() {
  const { t } = useLocale();
  const [tab, setTab] = useState<StoreStatus | 'all'>('pending');
  const [stores, setStores] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<StoreRequest[]>(`/admin/stores${query}`);
      setStores(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('stores.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    load();
  }, [load]);

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
        stores.map((s) => (
          <StoreRequestCard
            key={s.id}
            store={s}
            onApprove={handleApprove}
            onReject={handleReject}
            onTogglePayment={handleTogglePayment}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
          />
        ))
      )}
    </div>
  );
}

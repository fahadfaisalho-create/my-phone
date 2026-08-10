'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreRequest, StoreStatus } from '@/lib/types';
import StoreRequestCard from '@/components/StoreRequestCard';

const TABS: { key: StoreStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'active', label: 'نشط' },
  { key: 'rejected', label: 'مرفوض' },
  { key: 'suspended', label: 'موقوف' },
  { key: 'all', label: 'الكل' },
];

export default function StoresSection() {
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [tab]);

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
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>طلبات وحسابات المحلات {!loading && `(${stores.length})`}</h3>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">جارٍ التحميل...</div>
      ) : stores.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد محلات في هذه الحالة</p>
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

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, clearSession, getToken, getUser } from '@/lib/api';
import { StoreRequest, StoreStatus } from '@/lib/types';
import Topbar from '@/components/Topbar';
import StoreRequestCard from '@/components/StoreRequestCard';

const TABS: { key: StoreStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'active', label: 'نشط' },
  { key: 'rejected', label: 'مرفوض' },
  { key: 'suspended', label: 'موقوف' },
  { key: 'all', label: 'الكل' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<StoreStatus | 'all'>('pending');
  const [stores, setStores] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

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
    if (ready) load();
  }, [ready, load]);

  function handleExit() {
    clearSession();
    router.replace('/login');
  }

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

  if (!ready) return null;

  return (
    <div className="app">
      <Topbar title="لوحة تحكم الإدارة" roleLabel="مدير" onExit={handleExit} />

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        طلبات وحسابات المحلات {!loading && `(${stores.length})`}
      </h3>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">جارٍ التحميل...</div>
      ) : stores.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد محلات في هذه الحالة</p>
        </div>
      ) : (
        stores.map((s) => (
          <StoreRequestCard key={s.id} store={s} onApprove={handleApprove} onReject={handleReject} />
        ))
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearSession, getToken } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { Store } from '@/lib/types';

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/entry');
      return;
    }
    setReady(true);
  }, [router]);

  async function refresh() {
    setChecking(true);
    try {
      const store = await apiFetch<Store>('/stores/me');
      if (store.status !== 'pending') {
        router.replace(routeForStatus(store.status));
        return;
      }
    } finally {
      setChecking(false);
    }
  }

  function handleExit() {
    clearSession();
    router.replace('/entry');
  }

  if (!ready) return null;

  return (
    <div className="app">
      <div className="card card-narrow center" style={{ marginTop: 60 }}>
        <span className="badge b-pending">قيد المراجعة من الإدارة</span>
        <p style={{ color: 'var(--muted)', marginTop: 14 }}>
          طلبك وصل للإدارة وبانتظار المراجعة. اضغط "تحديث الحالة" للتحقق إذا صار قرار.
        </p>
        <button className="secondary" onClick={refresh} disabled={checking}>
          {checking ? 'جارٍ التحقق...' : 'تحديث الحالة'}
        </button>
        <div style={{ marginTop: 12 }}>
          <button className="link" onClick={handleExit}>
            خروج
          </button>
        </div>
      </div>
    </div>
  );
}

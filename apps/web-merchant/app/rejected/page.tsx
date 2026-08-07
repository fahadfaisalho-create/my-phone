'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, clearSession, getToken } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { Store } from '@/lib/types';

export default function RejectedPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/entry');
      return;
    }
    (async () => {
      try {
        const s = await apiFetch<Store>('/stores/me');
        if (s.status !== 'rejected') {
          router.replace(routeForStatus(s.status));
          return;
        }
        setStore(s);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات المحل');
      }
    })();
  }, [router]);

  function handleExit() {
    clearSession();
    router.replace('/entry');
  }

  if (error) {
    return (
      <div className="app">
        <div className="card card-narrow center" style={{ marginTop: 60 }}>
          <div className="err">{error}</div>
          <button className="link" onClick={handleExit}>
            خروج
          </button>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="app">
      <div className="card card-narrow center" style={{ marginTop: 60 }}>
        <span className="badge b-rejected">تم رفض الطلب</span>
        <p style={{ margin: '10px 0', fontSize: 13 }}>السبب: {store.rejectionReason || 'غير محدد'}</p>
        <button className="primary" onClick={() => router.push('/edit-store')}>
          تعديل البيانات وإعادة الإرسال
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

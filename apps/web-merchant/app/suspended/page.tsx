'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/api';

export default function SuspendedPage() {
  const router = useRouter();
  function handleExit() {
    clearSession();
    router.replace('/entry');
  }
  return (
    <div className="app">
      <div className="card card-narrow center" style={{ marginTop: 60 }}>
        <span className="badge b-suspended">الحساب موقوف</span>
        <p style={{ color: 'var(--muted)', marginTop: 14 }}>
          تم إيقاف حسابك من قبل الإدارة. تواصل مع الدعم لمزيد من التفاصيل.
        </p>
        <button className="link" onClick={handleExit}>
          خروج
        </button>
      </div>
    </div>
  );
}

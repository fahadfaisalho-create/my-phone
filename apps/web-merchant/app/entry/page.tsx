'use client';

import { useRouter } from 'next/navigation';

export default function EntryPage() {
  const router = useRouter();
  return (
    <div className="app">
      <div className="card card-narrow center" style={{ marginTop: 60 }}>
        <h2>بوابة التاجر</h2>
        <button
          className="primary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => router.push('/login')}
        >
          تسجيل الدخول
        </button>
        <button className="secondary" style={{ width: '100%' }} onClick={() => router.push('/register')}>
          تسجيل جديد
        </button>
      </div>
    </div>
  );
}

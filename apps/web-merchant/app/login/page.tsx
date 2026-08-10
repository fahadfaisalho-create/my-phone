'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';

interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string } | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.user.role !== 'merchant_rep') {
        setError('هذا الحساب ليس حساب تاجر');
        return;
      }
      setSession(res.accessToken, res.user);
      if (!res.store) {
        setError('لا يوجد محل مرتبط بهذا الحساب');
        return;
      }
      router.replace(routeForStatus(res.store.status as any));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 60 }}>
        <h2>تسجيل دخول التاجر</h2>
        {error && <div className="err">{error}</div>}
        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label htmlFor="password">كلمة السر</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'جارٍ الدخول...' : 'دخول'}
        </button>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="link" onClick={() => router.push('/entry')}>
            رجوع
          </button>
          <button type="button" className="link" onClick={() => router.push('/forgot-password')}>
            نسيت كلمة السر؟
          </button>
        </div>
      </form>
    </div>
  );
}

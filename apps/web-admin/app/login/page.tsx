'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';

interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
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
      if (res.user.role !== 'admin') {
        setError('هذا الحساب ليس حساب إدارة');
        return;
      }
      setSession(res.accessToken, res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 60 }}>
        <h2>دخول الإدارة</h2>
        {error && <div className="err">{error}</div>}
        <label htmlFor="email">البريد الإلكتروني</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
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
        <div style={{ marginTop: 12 }}>
          <button type="button" className="link" onClick={() => router.push('/forgot-password')}>
            نسيت كلمة السر؟
          </button>
        </div>
      </form>
    </div>
  );
}

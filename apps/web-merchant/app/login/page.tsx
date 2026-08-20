'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { useLocale } from '@/lib/i18n';

interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string } | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
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
        setError(t('login.notMerchant'));
        return;
      }
      setSession(res.accessToken, res.user);
      if (!res.store) {
        setError(t('login.noStore'));
        return;
      }
      router.replace(routeForStatus(res.store.status as any));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 420, margin: '20px auto 0' }}>
        <button type="button" className="link" onClick={toggleLocale}>
          🌐 {t('topbar.lang')}
        </button>
      </div>
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <h2>{t('login.title')}</h2>
        {error && <div className="err">{error}</div>}
        <label htmlFor="email">{t('login.email')}</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label htmlFor="password">{t('login.password')}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="link" onClick={() => router.push('/entry')}>
            {t('login.back')}
          </button>
          <button type="button" className="link" onClick={() => router.push('/forgot-password')}>
            {t('login.forgot')}
          </button>
        </div>
      </form>
    </div>
  );
}

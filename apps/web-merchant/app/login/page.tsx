'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { StoreSection } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

const PERMISSIONS_KEY = 'employee_permissions';

interface MerchantLoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string } | null;
}

interface EmployeeLoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  permissions: StoreSection[];
  storeId: string;
}

// صفحة دخول موحّدة للتاجر (صاحب المحل) وللحساب الفرعي (الموظف) معاً — نميّز
// بينهما من شكل الحقل: بريد إلكتروني (فيه @) يذهب لتسجيل دخول التاجر،
// وأي شيء غيره (رقم جوال) يذهب لتسجيل دخول الحساب الفرعي
export default function LoginPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const value = identifier.trim();
      const isEmail = value.includes('@');

      if (isEmail) {
        const res = await apiFetch<MerchantLoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: value, password }),
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
      } else {
        const res = await apiFetch<EmployeeLoginResponse>('/auth/employee-login', {
          method: 'POST',
          body: JSON.stringify({ phone: value, password }),
        });
        setSession(res.accessToken, res.user);
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(res.permissions));
        router.replace('/employee/dashboard');
      }
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
        <label htmlFor="identifier">{t('login.identifier')}</label>
        <input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
        />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: -8, marginBottom: 12 }}>
          {t('login.identifierHint')}
        </div>
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { StoreSection } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

const PERMISSIONS_KEY = 'employee_permissions';

interface EmployeeLoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  permissions: StoreSection[];
  storeId: string;
}

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<EmployeeLoginResponse>('/auth/employee-login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      if (res.user.role !== 'employee') {
        setError(t('employeeLogin.notEmployee'));
        return;
      }
      setSession(res.accessToken, res.user);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(res.permissions));
      router.replace('/employee/dashboard');
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
        <h2>{t('employeeLogin.title')}</h2>
        {error && <div className="err">{error}</div>}
        <label htmlFor="phone">{t('employeeLogin.phone')}</label>
        <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required autoFocus placeholder="05xxxxxxxx" />
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
      </form>
    </div>
  );
}

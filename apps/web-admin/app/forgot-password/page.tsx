'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(res.message);
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('forgotPassword.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('forgotPassword.updateError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {step === 'request' ? (
        <form className="card card-narrow" onSubmit={handleRequest} style={{ marginTop: 60 }}>
          <h2>{t('forgotPassword.requestTitle')}</h2>
          <p className="note">{t('forgotPassword.requestNote')}</p>
          {error && <div className="err">{error}</div>}
          <label htmlFor="email">{t('forgotPassword.email')}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="link" onClick={() => router.push('/login')}>
              {t('forgotPassword.backToLogin')}
            </button>
          </div>
        </form>
      ) : (
        <form className="card card-narrow" onSubmit={handleReset} style={{ marginTop: 60 }}>
          <h2>{t('forgotPassword.resetTitle')}</h2>
          {message && <p className="note">{message}</p>}
          {error && <div className="err">{error}</div>}
          <label htmlFor="token">{t('forgotPassword.tokenLabel')}</label>
          <input id="token" value={token} onChange={(e) => setToken(e.target.value)} required autoFocus />
          <label htmlFor="newPassword">{t('forgotPassword.newPasswordLabel')}</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('forgotPassword.updating') : t('forgotPassword.updatePassword')}
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="link" onClick={() => setStep('request')}>
              {t('forgotPassword.resend')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

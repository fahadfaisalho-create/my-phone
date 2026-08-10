'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      setError(err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم');
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث كلمة السر');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {step === 'request' ? (
        <form className="card card-narrow" onSubmit={handleRequest} style={{ marginTop: 60 }}>
          <h2>استعادة كلمة السر</h2>
          <p className="note">أدخل بريدك الإلكتروني وسنرسل لك رمز استعادة.</p>
          {error && <div className="err">{error}</div>}
          <label htmlFor="email">البريد الإلكتروني</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'جارٍ الإرسال...' : 'إرسال رمز الاستعادة'}
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="link" onClick={() => router.push('/login')}>
              رجوع لتسجيل الدخول
            </button>
          </div>
        </form>
      ) : (
        <form className="card card-narrow" onSubmit={handleReset} style={{ marginTop: 60 }}>
          <h2>إدخال رمز الاستعادة</h2>
          {message && <p className="note">{message}</p>}
          {error && <div className="err">{error}</div>}
          <label htmlFor="token">رمز الاستعادة (من البريد)</label>
          <input id="token" value={token} onChange={(e) => setToken(e.target.value)} required autoFocus />
          <label htmlFor="newPassword">كلمة السر الجديدة</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'جارٍ التحديث...' : 'تحديث كلمة السر'}
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="link" onClick={() => setStep('request')}>
              لم يصلني رمز — إعادة الإرسال
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

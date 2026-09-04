'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession, AdminUser } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

// دخول الإدمن على الدومين الموحّد (myphoneksa.com) صار جزءاً من صفحة الدخول
// الموحّدة على myphoneksa.com/login — نفس الرابط لكل الحسابات (تاجر/موظف/إدمن)
// عمداً، بلا أي إشارة لوجود حساب إدمن. لهذا هذا المسار يوجّه فوراً لهناك
// (window.location وليس موجّه Next.js حتى يتجاوز الـ basePath '/admin' ويوصل
// لجذر الدومين فعلياً) — لكن هذا التوجيه يفترض وجود بروكسي إعادة كتابة على
// نفس الدومين (rewrite في تطبيق المستهلك)، وهذا غير متوفر على نشرات Vercel
// المباشرة (preview/staging) اللي ما تمر من هذا البروكسي. فعلى أي دومين غير
// الدومين الرئيسي نعرض نموذج دخول حقيقي هنا مباشرة بدل التوجيه لرابط مكسور.
const PRODUCTION_HOST_HINT = 'myphoneksa.com';

export default function LoginPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
  const [checked, setChecked] = useState(false);
  const [onUnifiedDomain, setOnUnifiedDomain] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.hostname.includes(PRODUCTION_HOST_HINT)) {
      window.location.href = '/login';
      return;
    }
    setOnUnifiedDomain(false);
    setChecked(true);
  }, []);

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
        setError(t('login.notAdmin'));
        return;
      }
      setSession(res.accessToken, res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  if (!checked || onUnifiedDomain) return null;

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 440, margin: '20px auto 0' }}>
        <button type="button" className="link" onClick={toggleLocale}>
          English
        </button>
      </div>
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
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
        <div style={{ marginTop: 12 }}>
          <button type="button" className="link" onClick={() => router.push('/forgot-password')}>
            {t('login.forgot')}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { StoreSection } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

const PERMISSIONS_KEY = 'employee_permissions';
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

interface UnifiedLoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string } | null;
  permissions?: StoreSection[];
  storeId?: string | null;
}

// صفحة دخول واحدة للجميع: التاجر (صاحب المحل)، الحساب الفرعي (الموظف)،
// والإدمن — نفس الرابط ونفس النموذج بالضبط بلا أي إشارة لوجود أكثر من نوع
// حساب. النقطة الخلفية /auth/login واحدة، والدور اللي يرجع بالرد هو اللي
// يحدد وجهة التوجيه — بلا أي تمييز ظاهر بالواجهة
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
      const res = await apiFetch<UnifiedLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.user.role === 'admin') {
        // تطبيق الإدمن نشر منفصل يُخدَّم عبر /admin على نفس الدومين (rewrite)
        // — نفس الأصل (origin) فعلياً، فنكتب بيانات جلسته بنفس مفاتيحه
        localStorage.setItem(ADMIN_TOKEN_KEY, res.accessToken);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.user));
        window.location.href = '/admin/dashboard';
        return;
      }

      if (res.user.role === 'employee') {
        setSession(res.accessToken, res.user);
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(res.permissions ?? []));
        router.replace('/employee/dashboard');
        return;
      }

      // merchant_rep
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
          {t('topbar.lang')}
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

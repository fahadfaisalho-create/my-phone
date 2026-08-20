'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n';

export default function EntryPage() {
  const router = useRouter();
  const { t, toggleLocale } = useLocale();
  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 420, margin: '20px auto 0' }}>
        <button type="button" className="link" onClick={toggleLocale}>
          🌐 {t('topbar.lang')}
        </button>
      </div>
      <div className="card card-narrow center" style={{ marginTop: 12 }}>
        <h2>{t('entry.title')}</h2>
        <button
          className="primary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => router.push('/login')}
        >
          {t('entry.login')}
        </button>
        <button className="secondary" style={{ width: '100%' }} onClick={() => router.push('/register')}>
          {t('entry.register')}
        </button>
      </div>
    </div>
  );
}

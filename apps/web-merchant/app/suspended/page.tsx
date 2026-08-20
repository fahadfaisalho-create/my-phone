'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

export default function SuspendedPage() {
  const router = useRouter();
  const { t } = useLocale();
  function handleExit() {
    clearSession();
    router.replace('/entry');
  }
  return (
    <div className="app">
      <div className="card card-narrow center" style={{ marginTop: 60 }}>
        <span className="badge b-suspended">{t('statusPages.suspendedBadge')}</span>
        <p style={{ color: 'var(--muted)', marginTop: 14 }}>
          {t('statusPages.suspendedNote')}
        </p>
        <button className="link" onClick={handleExit}>
          {t('statusPages.exit')}
        </button>
      </div>
    </div>
  );
}

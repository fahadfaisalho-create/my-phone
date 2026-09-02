'use client';

import Logo from './Logo';
import { useLocale } from '@/lib/i18n';

export default function Topbar({
  title,
  roleLabel,
  onExit,
}: {
  title: string;
  roleLabel: string;
  onExit: () => void;
}) {
  const { t, toggleLocale } = useLocale();
  return (
    <div className="topbar">
      <div className="brandrow">
        <Logo />
        <h1>{title}</h1>
      </div>
      <div className="right">
        <span className="role">{roleLabel}</span>
        <button className="link" onClick={toggleLocale} aria-label="Toggle language">
          {t('topbar.lang')}
        </button>
        <button onClick={onExit}>{t('topbar.exit')}</button>
      </div>
    </div>
  );
}

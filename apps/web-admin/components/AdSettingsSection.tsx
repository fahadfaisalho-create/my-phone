'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface PlatformSettings {
  id: string;
  adDailyRate: string | number;
}

interface AdStats {
  ads: { paidCount: number; paidRevenue: number };
}

export default function AdSettingsSection() {
  const { t, locale } = useLocale();
  const numberLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  function riyal(n: number) {
    return `${n.toLocaleString(numberLocale)} ﷼`;
  }

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        apiFetch<PlatformSettings>('/admin/settings'),
        apiFetch<AdStats>('/admin/stats'),
      ]);
      setSettings(s);
      setRate(String(s.adDailyRate));
      setStats(st);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ads.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!rate || Number(rate) < 0) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const s = await apiFetch<PlatformSettings>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ adDailyRate: Number(rate) }),
      });
      setSettings(s);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ads.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner-wrap">{t('common.loading')}</div>;

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>{t('ads.priceHeading')}</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          {t('ads.priceNote')}
        </p>
        <div className="row2">
          <div>
            <label htmlFor="rate">{t('ads.dailyPrice')}</label>
            <input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setSaved(false);
              }}
            />
          </div>
        </div>
        {error && <div className="err">{error}</div>}
        {saved && !error && <p style={{ color: 'var(--accent, #16a34a)', fontSize: 13 }}>{t('ads.saveSuccess')}</p>}
        <button
          className="primary"
          onClick={handleSave}
          disabled={saving || !rate || Number(rate) === Number(settings?.adDailyRate ?? -1)}
        >
          {saving ? t('common.saving') : t('ads.savePrice')}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>{t('ads.revenueHeading')}</h3>
        <div className="grid3">
          <div className="metric">
            <div className="v">{stats?.ads.paidCount ?? 0}</div>
            <div className="l">{t('ads.paidCount')}</div>
          </div>
          <div className="metric">
            <div className="v">{riyal(stats?.ads.paidRevenue ?? 0)}</div>
            <div className="l">{t('ads.totalRevenue')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

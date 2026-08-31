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
  const [statsError, setStatsError] = useState('');
  const [saved, setSaved] = useState(false);

  // كل قسم يحمّل بيانته بشكل مستقل — تعطّل مؤقت بأحد الطلبين (مثل بطء قاعدة
  // البيانات وقت بدء الاتصال) ما يمنع القسم الثاني من الظهور، ولكل قسم زر
  // إعادة محاولة خاص به بدل ما تختفي كل الصفحة بسبب خطأ بطلب واحد فقط.
  async function loadSettings() {
    try {
      const s = await apiFetch<PlatformSettings>('/admin/settings');
      setSettings(s);
      setRate(String(s.adDailyRate));
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ads.loadError'));
    }
  }

  async function loadStats() {
    try {
      const st = await apiFetch<AdStats>('/admin/stats');
      setStats(st);
      setStatsError('');
    } catch (err) {
      setStatsError(err instanceof ApiError ? err.message : t('ads.loadError'));
    }
  }

  async function load() {
    setLoading(true);
    await Promise.allSettled([loadSettings(), loadStats()]);
    setLoading(false);
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
        {error && (
          <div className="err" style={{ marginBottom: 12 }}>
            {error}{' '}
            <button className="link" onClick={loadSettings}>
              {t('common.retry')}
            </button>
          </div>
        )}
        {settings && (
          <>
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
            {saved && !error && <p style={{ color: 'var(--accent, #16a34a)', fontSize: 13 }}>{t('ads.saveSuccess')}</p>}
            <button
              className="primary"
              onClick={handleSave}
              disabled={saving || !rate || Number(rate) === Number(settings?.adDailyRate ?? -1)}
            >
              {saving ? t('common.saving') : t('ads.savePrice')}
            </button>
          </>
        )}
      </div>

      {statsError ? (
        <div className="card">
          <div className="err" style={{ marginBottom: 0 }}>
            {statsError}{' '}
            <button className="link" onClick={loadStats}>
              {t('common.retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="hero-stat">
            <div>
              <div className="label">{t('ads.totalRevenue')}</div>
              <div className="value">{riyal(stats?.ads.paidRevenue ?? 0)}</div>
            </div>
          </div>
          <div className="grid3">
            <div className="metric">
              <div className="v">{stats?.ads.paidCount ?? 0}</div>
              <div className="l">{t('ads.paidCount')}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

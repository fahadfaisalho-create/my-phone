'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface PlatformSettings {
  id: string;
  adDailyRate: string | number;
}

interface AdStats {
  ads: { paidCount: number; paidRevenue: number };
}

function riyal(n: number) {
  return `${n.toLocaleString('ar-SA')} ﷼`;
}

export default function AdSettingsSection() {
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل إعدادات الإعلانات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ السعر');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner-wrap">جارٍ التحميل...</div>;

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>سعر الإعلان المميز اليومي</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          هذا السعر هو ما يدفعه المحل عن كل يوم إعلان مميز يظهر بشريط "إعلانات مميزة" أعلى الصفحة الرئيسية بتطبيق
          المستهلك.
        </p>
        <div className="row2">
          <div>
            <label htmlFor="rate">السعر لليوم الواحد (﷼)</label>
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
        {saved && !error && <p style={{ color: 'var(--accent, #16a34a)', fontSize: 13 }}>تم حفظ السعر بنجاح</p>}
        <button
          className="primary"
          onClick={handleSave}
          disabled={saving || !rate || Number(rate) === Number(settings?.adDailyRate ?? -1)}
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ السعر'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>إيرادات الإعلانات</h3>
        <div className="grid3">
          <div className="metric">
            <div className="v">{stats?.ads.paidCount ?? 0}</div>
            <div className="l">إعلانات مدفوعة</div>
          </div>
          <div className="metric">
            <div className="v">{riyal(stats?.ads.paidRevenue ?? 0)}</div>
            <div className="l">إجمالي إيراد الإعلانات</div>
          </div>
        </div>
      </div>
    </div>
  );
}

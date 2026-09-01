'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Status {
  checkedIn: boolean;
  checkInAt: string | null;
  hasZone: boolean;
}

export default function AttendanceWidget() {
  const { t, tf, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Status>('/attendance/me');
      setStatus(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('attendanceWidget.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(t('attendanceWidget.noGeoSupport')));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error(t('attendanceWidget.geoError'))), {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    });
  }

  async function handleToggle() {
    if (!status) return;
    setBusy(true);
    setError('');
    try {
      const pos = await getPosition();
      const body = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      await apiFetch(status.checkedIn ? '/attendance/check-out' : '/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('attendanceWidget.error'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  if (!status) return null;

  if (!status.hasZone) {
    return (
      <div className="note" style={{ marginBottom: 16 }}>
        {t('attendanceWidget.noZone')}
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}
    >
      <div>
        <b>{t('attendanceWidget.heading')}</b>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
          {status.checkedIn
            ? tf('attendanceWidget.checkedInSince', status.checkInAt ? new Date(status.checkInAt).toLocaleTimeString(dateLocale) : '')
            : t('attendanceWidget.notCheckedIn')}
        </div>
        {error && <div className="err" style={{ marginTop: 6, marginBottom: 0 }}>{error}</div>}
      </div>
      <button className={status.checkedIn ? 'danger' : 'primary'} onClick={handleToggle} disabled={busy}>
        {busy ? t('attendanceWidget.working') : status.checkedIn ? t('attendanceWidget.checkOut') : t('attendanceWidget.checkIn')}
      </button>
    </div>
  );
}

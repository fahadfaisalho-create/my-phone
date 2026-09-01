'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, downloadFile } from '@/lib/api';
import { AttendanceRecord } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function AttendanceTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      const qs = query.toString();
      const data = await apiFetch<AttendanceRecord[]>(`/stores/me/attendance${qs ? `?${qs}` : ''}`);
      setRecords(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('attendanceTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport() {
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      const qs = query.toString();
      await downloadFile(`/stores/me/attendance/export${qs ? `?${qs}` : ''}`, 'attendance.xlsx');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('attendanceTab.exportError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>{t('attendanceTab.heading')}</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          {t('attendanceTab.note')}
        </p>
        <div className="row2">
          <div>
            <label htmlFor="attFrom">{t('attendanceTab.from')}</label>
            <input id="attFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="attTo">{t('attendanceTab.to')}</label>
            <input id="attTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={load} disabled={loading}>
            {t('attendanceTab.filter')}
          </button>
          <button className="primary" onClick={handleExport} disabled={records.length === 0}>
            ⬇️ {t('attendanceTab.exportExcel')}
          </button>
        </div>
      </div>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : records.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('attendanceTab.empty')}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>
                <th style={{ padding: '10px 16px' }}>{t('attendanceTab.employee')}</th>
                <th style={{ padding: '10px' }}>{t('attendanceTab.checkIn')}</th>
                <th style={{ padding: '10px 16px' }}>{t('attendanceTab.checkOut')}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: idx % 2 ? 'var(--bg)' : undefined }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ink)' }}>
                    {r.employee.firstName} {r.employee.lastName}
                  </td>
                  <td style={{ padding: '12px 10px' }}>{new Date(r.checkInAt).toLocaleString(dateLocale)}</td>
                  <td style={{ padding: '12px 16px', color: r.checkOutAt ? undefined : 'var(--amber)' }}>
                    {r.checkOutAt ? new Date(r.checkOutAt).toLocaleString(dateLocale) : t('attendanceTab.notCheckedOutYet')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

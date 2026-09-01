'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { TechnicianRequest, TechnicianStatus } from '@/lib/types';
import TechnicianRequestCard, { BADGE_CLASS, BADGE_NAV_KEY } from '@/components/TechnicianRequestCard';
import { useLocale } from '@/lib/i18n';

const TAB_KEYS: { key: TechnicianStatus | 'all'; navKey: string }[] = [
  { key: 'pending', navKey: 'technicians.tabPending' },
  { key: 'approved', navKey: 'technicians.tabApproved' },
  { key: 'rejected', navKey: 'technicians.tabRejected' },
  { key: 'all', navKey: 'common.all' },
];

export default function TechniciansSection() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [tab, setTab] = useState<TechnicianStatus | 'all'>('pending');
  const [technicians, setTechnicians] = useState<TechnicianRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<TechnicianRequest[]>(`/admin/technicians${query}`);
      setTechnicians(data);
      setSelectedId((prev) => (prev && data.some((s) => s.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('technicians.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = technicians.find((s) => s.id === selectedId) ?? null;

  async function handleApprove(id: string) {
    await apiFetch(`/admin/technicians/${id}/approve`, { method: 'PATCH' });
    await load();
  }

  async function handleReject(id: string, reason: string) {
    await apiFetch(`/admin/technicians/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    await load();
  }

  return (
    <div>
      <div className="tabs">
        {TAB_KEYS.map((tabItem) => (
          <button key={tabItem.key} className={tab === tabItem.key ? 'on' : ''} onClick={() => setTab(tabItem.key)}>
            {t(tabItem.navKey)}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('technicians.heading')} {!loading && `(${technicians.length})`}
      </h3>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('technicians.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{technicians.length}</span>
            </div>
            <div className="split-list-body">
              {technicians.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('technicians.empty')}</p>
              )}
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className={`split-list-item ${tech.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(tech.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{tech.name}</b>
                    <span className={`badge ${BADGE_CLASS[tech.status]}`}>{t(BADGE_NAV_KEY[tech.status])}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {tech.store.name} · {new Date(tech.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail">
              <TechnicianRequestCard technician={selected} onApprove={handleApprove} onReject={handleReject} />
            </div>
          ) : (
            <div className="split-empty">{t('technicians.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

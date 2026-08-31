'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

type TicketStatus = 'open' | 'in_progress' | 'closed';
type RelatedType = 'store' | 'consumer';

interface Ticket {
  id: string;
  relatedType: RelatedType;
  relatedId: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

const TAB_KEYS: { key: TicketStatus | 'all'; navKey: string }[] = [
  { key: 'open', navKey: 'support.tabOpen' },
  { key: 'in_progress', navKey: 'support.tabInProgress' },
  { key: 'closed', navKey: 'support.tabClosed' },
  { key: 'all', navKey: 'common.all' },
];

const BADGE_CLASS: Record<TicketStatus, string> = {
  open: 'b-pending',
  in_progress: 'b-pending',
  closed: 'b-active',
};
const BADGE_NAV_KEY: Record<TicketStatus, string> = {
  open: 'support.tabOpen',
  in_progress: 'support.tabInProgress',
  closed: 'support.tabClosed',
};
const RELATED_NAV_KEY: Record<RelatedType, string> = {
  store: 'support.fromStore',
  consumer: 'support.fromConsumer',
};

export default function SupportTicketsSection() {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<TicketStatus | 'all'>('open');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<Ticket[]>(`/support-tickets${query}`);
      setTickets(data);
      setSelectedId((prev) => (prev && data.some((x) => x.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('support.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = tickets.find((x) => x.id === selectedId) ?? null;

  async function updateStatus(id: string, status: TicketStatus) {
    setBusyId(id);
    try {
      await apiFetch(`/support-tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('support.updateError'));
    } finally {
      setBusyId(null);
    }
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
        {t('support.heading')} {!loading && `(${tickets.length})`}
      </h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('support.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{tickets.length}</span>
            </div>
            <div className="split-list-body">
              {tickets.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('support.empty')}</p>
              )}
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`split-list-item ${ticket.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{ticket.subject}</b>
                    <span className={`badge ${BADGE_CLASS[ticket.status]}`}>{t(BADGE_NAV_KEY[ticket.status])}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {t(RELATED_NAV_KEY[ticket.relatedType])} · {new Date(ticket.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <b style={{ fontSize: 16 }}>{selected.subject}</b>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                    {t('support.fromLabel')}: {t(RELATED_NAV_KEY[selected.relatedType])} ·{' '}
                    {new Date(selected.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
                <span className={`badge ${BADGE_CLASS[selected.status]}`}>{t(BADGE_NAV_KEY[selected.status])}</span>
              </div>

              <div className="detail-actions">
                {selected.status !== 'in_progress' && (
                  <button className="btn-lg outline-red" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'in_progress')}>
                    {t('support.markInProgress')}
                  </button>
                )}
                {selected.status !== 'closed' && (
                  <button className="btn-lg primary" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'closed')}>
                    {t('support.close')}
                  </button>
                )}
                {selected.status === 'closed' && (
                  <button className="btn-lg outline-red" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'open')}>
                    {t('support.reopen')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('support.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

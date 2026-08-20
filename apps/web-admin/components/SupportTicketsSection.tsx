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
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<Ticket[]>(`/support-tickets${query}`);
      setTickets(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('support.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    load();
  }, [load]);

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
      ) : tickets.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('support.empty')}</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div className="card" key={ticket.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <b>{ticket.subject}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {t('support.fromLabel')}: {t(RELATED_NAV_KEY[ticket.relatedType])} ·{' '}
                  {new Date(ticket.createdAt).toLocaleDateString(dateLocale)}
                </div>
              </div>
              <span className={`badge ${BADGE_CLASS[ticket.status]}`}>{t(BADGE_NAV_KEY[ticket.status])}</span>
            </div>
            <div className="actions-row" style={{ marginTop: 12 }}>
              {ticket.status !== 'in_progress' && (
                <button className="secondary" disabled={busyId === ticket.id} onClick={() => updateStatus(ticket.id, 'in_progress')}>
                  {t('support.markInProgress')}
                </button>
              )}
              {ticket.status !== 'closed' && (
                <button className="primary" disabled={busyId === ticket.id} onClick={() => updateStatus(ticket.id, 'closed')}>
                  {t('support.close')}
                </button>
              )}
              {ticket.status === 'closed' && (
                <button className="secondary" disabled={busyId === ticket.id} onClick={() => updateStatus(ticket.id, 'open')}>
                  {t('support.reopen')}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

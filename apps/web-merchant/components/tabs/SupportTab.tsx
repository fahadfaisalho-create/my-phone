'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

type TicketStatus = 'open' | 'in_progress' | 'closed';

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

const BADGE_CLASS: Record<TicketStatus, string> = {
  open: 'b-pending',
  in_progress: 'b-pending',
  closed: 'b-active',
};

export default function SupportTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const BADGE_LABEL: Record<TicketStatus, string> = {
    open: t('supportTab.statusOpen'),
    in_progress: t('supportTab.statusInProgress'),
    closed: t('supportTab.statusClosed'),
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Ticket[]>('/support-tickets/me');
      setTickets(data);
      setSelectedId((prev) => (prev && data.some((x) => x.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('supportTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

  const selected = tickets.find((x) => x.id === selectedId) ?? null;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!subject.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim() }),
      });
      setSubject('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('supportTab.submitError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h3>{t('supportTab.newTicketHeading')}</h3>
        <input
          placeholder={t('supportTab.subjectPlaceholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        {error && <div className="err">{error}</div>}
        <button className="primary" onClick={handleSubmit} disabled={saving || !subject.trim()}>
          {saving ? t('supportTab.sending') : t('supportTab.send')}
        </button>
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('supportTab.myTicketsHeading')} {!loading && `(${tickets.length})`}
      </h3>

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('supportTab.myTicketsHeading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{tickets.length}</span>
            </div>
            <div className="split-list-body">
              {tickets.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('supportTab.empty')}</p>
              )}
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`split-list-item ${ticket.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{ticket.subject}</b>
                    <span className={`badge ${BADGE_CLASS[ticket.status]}`}>{BADGE_LABEL[ticket.status]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(ticket.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <b style={{ fontSize: 16 }}>{selected.subject}</b>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(selected.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
                <span className={`badge ${BADGE_CLASS[selected.status]}`}>{BADGE_LABEL[selected.status]}</span>
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('supportTab.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

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

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Ticket[]>('/support-tickets/me');
      setTickets(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('supportTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

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

      <div className="card">
        <h3>{t('supportTab.myTicketsHeading')}</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('supportTab.empty')}</p>
        ) : (
          tickets.map((ticket) => (
            <div className="rowline" key={ticket.id}>
              <span>{ticket.subject}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)' }}>{new Date(ticket.createdAt).toLocaleDateString(dateLocale)}</span>
                <span className={`badge ${BADGE_CLASS[ticket.status]}`}>{BADGE_LABEL[ticket.status]}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

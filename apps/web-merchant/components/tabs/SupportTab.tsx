'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

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
const BADGE_LABEL: Record<TicketStatus, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  closed: 'مغلقة',
};

export default function SupportTab() {
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل تذاكرك');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      setError(err instanceof ApiError ? err.message : 'تعذّر فتح التذكرة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h3>فتح تذكرة دعم جديدة</h3>
        <input
          placeholder="اكتب موضوع مشكلتك أو استفسارك..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        {error && <div className="err">{error}</div>}
        <button className="primary" onClick={handleSubmit} disabled={saving || !subject.trim()}>
          {saving ? 'جارٍ الإرسال...' : 'إرسال للدعم'}
        </button>
      </div>

      <div className="card">
        <h3>تذاكري</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد تذاكر بعد</p>
        ) : (
          tickets.map((t) => (
            <div className="rowline" key={t.id}>
              <span>{t.subject}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)' }}>{new Date(t.createdAt).toLocaleDateString('ar-SA')}</span>
                <span className={`badge ${BADGE_CLASS[t.status]}`}>{BADGE_LABEL[t.status]}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

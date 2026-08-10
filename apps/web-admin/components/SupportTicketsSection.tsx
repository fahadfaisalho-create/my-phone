'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

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

const TABS: { key: TicketStatus | 'all'; label: string }[] = [
  { key: 'open', label: 'مفتوحة' },
  { key: 'in_progress', label: 'قيد المعالجة' },
  { key: 'closed', label: 'مغلقة' },
  { key: 'all', label: 'الكل' },
];

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
const RELATED_LABEL: Record<RelatedType, string> = {
  store: 'محل',
  consumer: 'مستهلك',
};

export default function SupportTicketsSection() {
  const [tab, setTab] = useState<TicketStatus | 'all'>('open');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const data = await apiFetch<Ticket[]>(`/support-tickets${query}`);
      setTickets(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  }, [tab]);

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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث التذكرة');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>تذاكر الدعم {!loading && `(${tickets.length})`}</h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">جارٍ التحميل...</div>
      ) : tickets.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد تذاكر في هذه الحالة</p>
        </div>
      ) : (
        tickets.map((t) => (
          <div className="card" key={t.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <b>{t.subject}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  من: {RELATED_LABEL[t.relatedType]} · {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                </div>
              </div>
              <span className={`badge ${BADGE_CLASS[t.status]}`}>{BADGE_LABEL[t.status]}</span>
            </div>
            <div className="actions-row" style={{ marginTop: 12 }}>
              {t.status !== 'in_progress' && (
                <button className="secondary" disabled={busyId === t.id} onClick={() => updateStatus(t.id, 'in_progress')}>
                  قيد المعالجة
                </button>
              )}
              {t.status !== 'closed' && (
                <button className="primary" disabled={busyId === t.id} onClick={() => updateStatus(t.id, 'closed')}>
                  إغلاق
                </button>
              )}
              {t.status === 'closed' && (
                <button className="secondary" disabled={busyId === t.id} onClick={() => updateStatus(t.id, 'open')}>
                  إعادة فتح
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

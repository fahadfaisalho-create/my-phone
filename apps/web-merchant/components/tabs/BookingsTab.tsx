'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

type BookingStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';
type VisitType = 'in_store' | 'home_visit';

interface Booking {
  id: string;
  scheduledAt: string;
  status: BookingStatus;
  visitType: VisitType;
  customerAddress: string | null;
  consumer: { name: string; phone: string | null };
  service: { name: string };
  branch: { name: string };
}

const VISIT_LABEL: Record<VisitType, string> = {
  in_store: '🏬 بالمحل',
  home_visit: '🚗 زيارة منزلية',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'قيد المراجعة',
  accepted: 'مقبول',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};
const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: 'b-pending',
  accepted: 'b-active',
  completed: 'b-active',
  cancelled: 'b-rejected',
};

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Booking[]>('/stores/me/bookings');
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: BookingStatus) {
    setBusyId(id);
    try {
      await apiFetch(`/stores/me/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الحجز');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h3>الحجوزات</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد حجوزات بعد</p>
      ) : (
        bookings.map((b) => (
          <div className="rowline" key={b.id} style={{ alignItems: 'flex-start' }}>
            <div>
              <b style={{ fontSize: 13 }}>{b.consumer.name}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {b.service.name} · {b.branch.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(b.scheduledAt).toLocaleString('ar-SA', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {b.visitType === 'home_visit' && b.customerAddress && (
                <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4 }}>
                  📍 {b.customerAddress}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="badge" style={{ background: b.visitType === 'home_visit' ? '#FCEBEB' : '#F0F0F0' }}>
                {VISIT_LABEL[b.visitType]}
              </span>
              <span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="secondary" disabled={busyId === b.id} onClick={() => updateStatus(b.id, 'accepted')}>
                    قبول
                  </button>
                  <button className="danger" disabled={busyId === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>
                    إلغاء
                  </button>
                </div>
              )}
              {b.status === 'accepted' && (
                <button className="secondary" disabled={busyId === b.id} onClick={() => updateStatus(b.id, 'completed')}>
                  إنهاء
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

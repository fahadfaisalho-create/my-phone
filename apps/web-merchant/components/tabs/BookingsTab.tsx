'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

type BookingStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';
type VisitType = 'in_store' | 'home_visit';

interface Booking {
  id: string;
  scheduledAt: string;
  status: BookingStatus;
  visitType: VisitType;
  customerAddress: string | null;
  customerLat: string | null;
  customerLng: string | null;
  consumer: { name: string; phone: string | null };
  service: { name: string };
  branch: { name: string };
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: 'b-pending',
  accepted: 'b-active',
  completed: 'b-active',
  cancelled: 'b-rejected',
};

export default function BookingsTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const VISIT_LABEL: Record<VisitType, string> = {
    in_store: t('bookings.visitInStore'),
    home_visit: t('bookings.visitHomeVisit'),
  };
  const STATUS_LABEL: Record<BookingStatus, string> = {
    pending: t('bookings.statusPending'),
    accepted: t('bookings.statusAccepted'),
    completed: t('bookings.statusCompleted'),
    cancelled: t('bookings.statusCancelled'),
  };

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
      setError(err instanceof ApiError ? err.message : t('bookings.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err instanceof ApiError ? err.message : t('bookings.updateError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h3>{t('bookings.heading')}</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('bookings.empty')}</p>
      ) : (
        bookings.map((b) => (
          <div className="rowline" key={b.id} style={{ alignItems: 'flex-start' }}>
            <div>
              <b style={{ fontSize: 13 }}>{b.consumer.name}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {b.service.name} · {b.branch.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(b.scheduledAt).toLocaleString(dateLocale, {
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
              {b.visitType === 'home_visit' && b.customerLat && b.customerLng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${b.customerLat},${b.customerLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--teal-d, var(--ink))', marginTop: 2, display: 'inline-block' }}
                >
                  {t('bookings.openMap')}
                </a>
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
                    {t('bookings.accept')}
                  </button>
                  <button className="danger" disabled={busyId === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>
                    {t('bookings.cancel')}
                  </button>
                </div>
              )}
              {b.status === 'accepted' && (
                <button className="secondary" disabled={busyId === b.id} onClick={() => updateStatus(b.id, 'completed')}>
                  {t('bookings.finish')}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

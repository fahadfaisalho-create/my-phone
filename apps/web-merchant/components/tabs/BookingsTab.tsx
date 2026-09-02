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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Booking[]>('/stores/me/bookings');
      setBookings(data);
      setSelectedId((prev) => (prev && data.some((b) => b.id === prev) ? prev : data[0]?.id ?? null));
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

  const selected = bookings.find((b) => b.id === selectedId) ?? null;

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
    <div>
      <h3 style={{ margin: '4px 0 14px' }}>
        {t('bookings.heading')} {!loading && `(${bookings.length})`}
      </h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('bookings.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{bookings.length}</span>
            </div>
            <div className="split-list-body">
              {bookings.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('bookings.empty')}</p>
              )}
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className={`split-list-item ${b.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(b.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{b.consumer.name}</b>
                    <span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{b.service.name}</div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{selected.consumer.name}</b>
                  {selected.consumer.phone && (
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{selected.consumer.phone}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className="badge" style={{ background: selected.visitType === 'home_visit' ? '#FCEBEB' : '#F0F0F0' }}>
                    {VISIT_LABEL[selected.visitType]}
                  </span>
                  <span className={`badge ${STATUS_BADGE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}>{selected.service.name} · {selected.branch.name}</div>
                <div style={{ color: 'var(--muted)' }}>
                  {new Date(selected.scheduledAt).toLocaleString(dateLocale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {selected.visitType === 'home_visit' && selected.customerAddress && (
                <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 4 }}>{selected.customerAddress}</div>
              )}
              {selected.visitType === 'home_visit' && selected.customerLat && selected.customerLng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selected.customerLat},${selected.customerLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12.5, color: 'var(--indigo-d, var(--ink))', marginBottom: 14, display: 'inline-block' }}
                >
                  {t('bookings.openMap')}
                </a>
              )}

              <div className="detail-actions">
                {selected.status === 'pending' && (
                  <>
                    <button className="btn-lg primary" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'accepted')}>
                      {t('bookings.accept')}
                    </button>
                    <button className="btn-lg outline-red" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'cancelled')}>
                      {t('bookings.cancel')}
                    </button>
                  </>
                )}
                {selected.status === 'accepted' && (
                  <button className="btn-lg primary" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'completed')}>
                    {t('bookings.finish')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('bookings.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

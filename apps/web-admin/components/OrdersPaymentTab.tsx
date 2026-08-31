'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { AdminOrder, ORDER_STATUS_LABEL, ORDER_STATUS_LABEL_EN, PaymentStatus } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

const PAY_FILTER_KEYS: { key: PaymentStatus | 'all'; navKey: string }[] = [
  { key: 'unpaid', navKey: 'orders.tabUnpaid' },
  { key: 'paid', navKey: 'orders.tabPaid' },
  { key: 'all', navKey: 'common.all' },
];

export default function OrdersPaymentTab() {
  const { t, locale } = useLocale();
  const statusLabel = locale === 'ar' ? ORDER_STATUS_LABEL : ORDER_STATUS_LABEL_EN;
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('unpaid');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'all' ? '' : `?paymentStatus=${filter}`;
      const data = await apiFetch<AdminOrder[]>(`/admin/orders${query}`);
      setOrders(data);
      setSelectedId((prev) => (prev && data.some((o) => o.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('orders.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  async function togglePaid(id: string, paid: boolean) {
    setBusyId(id);
    try {
      await apiFetch(`/admin/orders/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paid }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('orders.updateError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="tabs">
        {PAY_FILTER_KEYS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
            {t(f.navKey)}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('orders.heading')} {!loading && `(${orders.length})`}
      </h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('orders.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{orders.length}</span>
            </div>
            <div className="split-list-body">
              {orders.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('orders.empty')}</p>
              )}
              {orders.map((o) => (
                <div
                  key={o.id}
                  className={`split-list-item ${o.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(o.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{o.store.name}</b>
                    <span className={`badge ${o.paymentStatus === 'paid' ? 'b-active' : 'b-pending'}`}>
                      {o.paymentStatus === 'paid' ? t('orders.paid') : o.paymentStatus === 'refunded' ? t('orders.refunded') : t('orders.unpaid')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {o.consumer.name} · {o.total} ﷼
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{selected.store.name}</b>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                    {selected.consumer.name} {selected.consumer.phone ? `· ${selected.consumer.phone}` : ''}
                  </div>
                </div>
                <span className="badge b-pending">{statusLabel[selected.status]}</span>
              </div>

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                {selected.items.map((i, idx) => (
                  <div key={idx} className="rowline" style={{ borderBottom: idx === selected.items.length - 1 ? 'none' : undefined }}>
                    <span>{i.product.name}</span>
                    <span style={{ color: 'var(--muted)' }}>× {i.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 14 }}>
                {selected.total} ﷼
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className={`badge ${selected.paymentStatus === 'paid' ? 'b-active' : 'b-pending'}`}>
                  {selected.paymentStatus === 'paid' ? t('orders.paid') : selected.paymentStatus === 'refunded' ? t('orders.refunded') : t('orders.unpaid')}
                </span>
              </div>
              <div className="detail-actions">
                <button
                  className={`btn-lg ${selected.paymentStatus === 'paid' ? 'outline-red' : 'primary'}`}
                  disabled={busyId === selected.id}
                  onClick={() => togglePaid(selected.id, selected.paymentStatus !== 'paid')}
                >
                  {selected.paymentStatus === 'paid' ? t('orders.unconfirmPayment') : t('orders.confirmPayment')}
                </button>
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('orders.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

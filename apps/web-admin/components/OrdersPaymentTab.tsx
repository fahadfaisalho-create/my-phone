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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'all' ? '' : `?paymentStatus=${filter}`;
      const data = await apiFetch<AdminOrder[]>(`/admin/orders${query}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('orders.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    load();
  }, [load]);

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
      ) : orders.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('orders.empty')}</p>
        </div>
      ) : (
        orders.map((o) => (
          <div className="card" key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <b>{o.store.name}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {o.consumer.name} {o.consumer.phone ? `· ${o.consumer.phone}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {o.items.map((i) => `${i.product.name} ×${i.qty}`).join('، ')}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 700, color: 'var(--ink)' }}>
                  {o.total} ﷼
                </div>
                <span className="badge b-pending" style={{ marginTop: 6, display: 'inline-flex' }}>
                  {statusLabel[o.status]}
                </span>
              </div>
            </div>
            <div className="actions-row" style={{ marginTop: 12 }}>
              <span className={`badge ${o.paymentStatus === 'paid' ? 'b-active' : 'b-pending'}`}>
                {o.paymentStatus === 'paid' ? t('orders.paid') : o.paymentStatus === 'refunded' ? t('orders.refunded') : t('orders.unpaid')}
              </span>
              <button
                className={o.paymentStatus === 'paid' ? 'secondary' : 'primary'}
                disabled={busyId === o.id}
                onClick={() => togglePaid(o.id, o.paymentStatus !== 'paid')}
              >
                {o.paymentStatus === 'paid' ? t('orders.unconfirmPayment') : t('orders.confirmPayment')}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

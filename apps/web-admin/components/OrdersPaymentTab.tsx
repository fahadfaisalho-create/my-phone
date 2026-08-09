'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { AdminOrder, ORDER_STATUS_LABEL, PaymentStatus } from '@/lib/types';

const PAY_FILTERS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'unpaid', label: 'غير مدفوعة' },
  { key: 'paid', label: 'مدفوعة' },
  { key: 'all', label: 'الكل' },
];

export default function OrdersPaymentTab() {
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث حالة الدفع');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="tabs">
        {PAY_FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>طلبات الشراء {!loading && `(${orders.length})`}</h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">جارٍ التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد طلبات في هذه الحالة</p>
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
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
            </div>
            <div className="actions-row" style={{ marginTop: 12 }}>
              <span className={`badge ${o.paymentStatus === 'paid' ? 'b-active' : 'b-pending'}`}>
                {o.paymentStatus === 'paid' ? 'مدفوع' : o.paymentStatus === 'refunded' ? 'مسترجع' : 'غير مدفوع'}
              </span>
              <button
                className={o.paymentStatus === 'paid' ? 'secondary' : 'primary'}
                disabled={busyId === o.id}
                onClick={() => togglePaid(o.id, o.paymentStatus !== 'paid')}
              >
                {o.paymentStatus === 'paid' ? 'إلغاء تأكيد الدفع' : 'تأكيد استلام الدفع'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

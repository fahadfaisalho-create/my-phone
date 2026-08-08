'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  total: string;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  consumer: { name: string; phone: string | null };
  items: { qty: number; product: { name: string } }[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'بانتظار المعالجة',
  processing: 'جارٍ التجهيز',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'b-pending',
  processing: 'b-pending',
  completed: 'b-active',
  cancelled: 'b-rejected',
};
const PAY_LABEL: Record<Order['paymentStatus'], string> = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  refunded: 'مسترجع',
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>('/stores/me/orders');
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await apiFetch(`/stores/me/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الطلب');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h3>الطلبات</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد طلبات بعد</p>
      ) : (
        orders.map((o) => (
          <div className="rowline" key={o.id} style={{ alignItems: 'flex-start' }}>
            <div>
              <b style={{ fontSize: 13 }}>{o.consumer.name}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {o.items.map((i) => `${i.product.name} ×${i.qty}`).join('، ')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {o.total} ﷼ · {PAY_LABEL[o.paymentStatus]}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              {o.status === 'pending' && o.paymentStatus === 'paid' && (
                <button className="secondary" disabled={busyId === o.id} onClick={() => updateStatus(o.id, 'processing')}>
                  بدء التجهيز
                </button>
              )}
              {o.status === 'processing' && (
                <button className="secondary" disabled={busyId === o.id} onClick={() => updateStatus(o.id, 'completed')}>
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

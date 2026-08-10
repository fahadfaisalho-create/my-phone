'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Stats {
  stores: Partial<Record<'pending' | 'active' | 'rejected' | 'suspended', number>>;
  orders: { total: number; paidCount: number; paidRevenue: number };
  bookings: Partial<Record<'pending' | 'accepted' | 'completed' | 'cancelled', number>>;
  subscriptions: { paidCount: number; paidRevenue: number; unpaidCount: number };
  supportTickets: Partial<Record<'open' | 'in_progress' | 'closed', number>>;
}

function riyal(n: number) {
  return `${n.toLocaleString('ar-SA')} ﷼`;
}

export default function ReportsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Stats>('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل التقارير');
      }
    })();
  }, []);

  if (error) return <div className="err">{error}</div>;
  if (!stats) return <div className="spinner-wrap">جارٍ التحميل...</div>;

  const storesTotal =
    (stats.stores.pending || 0) +
    (stats.stores.active || 0) +
    (stats.stores.rejected || 0) +
    (stats.stores.suspended || 0);

  const bookingsTotal =
    (stats.bookings.pending || 0) +
    (stats.bookings.accepted || 0) +
    (stats.bookings.completed || 0) +
    (stats.bookings.cancelled || 0);

  return (
    <div>
      <h3 style={{ marginBottom: 10 }}>المحلات ({storesTotal})</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.stores.active || 0}</div>
          <div className="l">نشط</div>
        </div>
        <div className="metric">
          <div className="v">{stats.stores.pending || 0}</div>
          <div className="l">قيد المراجعة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.stores.suspended || 0}</div>
          <div className="l">موقوف</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>الاشتراكات</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.subscriptions.paidCount}</div>
          <div className="l">اشتراكات مدفوعة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.subscriptions.unpaidCount}</div>
          <div className="l">اشتراكات غير مدفوعة</div>
        </div>
        <div className="metric">
          <div className="v">{riyal(stats.subscriptions.paidRevenue)}</div>
          <div className="l">إيراد الاشتراكات</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>الطلبات ({stats.orders.total})</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.orders.paidCount}</div>
          <div className="l">طلبات مدفوعة</div>
        </div>
        <div className="metric">
          <div className="v">{riyal(stats.orders.paidRevenue)}</div>
          <div className="l">إيراد الطلبات المدفوعة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.orders.total - stats.orders.paidCount}</div>
          <div className="l">طلبات غير مدفوعة</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>الحجوزات ({bookingsTotal})</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.bookings.pending || 0}</div>
          <div className="l">قيد الانتظار</div>
        </div>
        <div className="metric">
          <div className="v">{stats.bookings.accepted || 0}</div>
          <div className="l">مقبولة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.bookings.completed || 0}</div>
          <div className="l">مكتملة</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>تذاكر الدعم</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.supportTickets.open || 0}</div>
          <div className="l">مفتوحة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.supportTickets.in_progress || 0}</div>
          <div className="l">قيد المعالجة</div>
        </div>
        <div className="metric">
          <div className="v">{stats.supportTickets.closed || 0}</div>
          <div className="l">مغلقة</div>
        </div>
      </div>
    </div>
  );
}

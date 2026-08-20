'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Stats {
  stores: Partial<Record<'pending' | 'active' | 'rejected' | 'suspended', number>>;
  orders: { total: number; paidCount: number; paidRevenue: number };
  bookings: Partial<Record<'pending' | 'accepted' | 'completed' | 'cancelled', number>>;
  subscriptions: { paidCount: number; paidRevenue: number; unpaidCount: number };
  supportTickets: Partial<Record<'open' | 'in_progress' | 'closed', number>>;
}

export default function ReportsSection() {
  const { t, locale } = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const numberLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  function riyal(n: number) {
    return `${n.toLocaleString(numberLocale)} ﷼`;
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Stats>('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('reports.loadError'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="err">{error}</div>;
  if (!stats) return <div className="spinner-wrap">{t('common.loading')}</div>;

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
      <h3 style={{ marginBottom: 10 }}>
        {t('reports.stores')} ({storesTotal})
      </h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.stores.active || 0}</div>
          <div className="l">{t('reports.active')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.stores.pending || 0}</div>
          <div className="l">{t('reports.pending')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.stores.suspended || 0}</div>
          <div className="l">{t('reports.suspended')}</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>{t('reports.subscriptions')}</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.subscriptions.paidCount}</div>
          <div className="l">{t('reports.subsPaid')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.subscriptions.unpaidCount}</div>
          <div className="l">{t('reports.subsUnpaid')}</div>
        </div>
        <div className="metric">
          <div className="v">{riyal(stats.subscriptions.paidRevenue)}</div>
          <div className="l">{t('reports.subsRevenue')}</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>
        {t('reports.orders')} ({stats.orders.total})
      </h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.orders.paidCount}</div>
          <div className="l">{t('reports.ordersPaid')}</div>
        </div>
        <div className="metric">
          <div className="v">{riyal(stats.orders.paidRevenue)}</div>
          <div className="l">{t('reports.ordersRevenue')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.orders.total - stats.orders.paidCount}</div>
          <div className="l">{t('reports.ordersUnpaid')}</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>
        {t('reports.bookings')} ({bookingsTotal})
      </h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.bookings.pending || 0}</div>
          <div className="l">{t('reports.bookingsPending')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.bookings.accepted || 0}</div>
          <div className="l">{t('reports.bookingsAccepted')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.bookings.completed || 0}</div>
          <div className="l">{t('reports.bookingsCompleted')}</div>
        </div>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>{t('reports.supportTickets')}</h3>
      <div className="grid3">
        <div className="metric">
          <div className="v">{stats.supportTickets.open || 0}</div>
          <div className="l">{t('support.tabOpen')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.supportTickets.in_progress || 0}</div>
          <div className="l">{t('support.tabInProgress')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.supportTickets.closed || 0}</div>
          <div className="l">{t('support.tabClosed')}</div>
        </div>
      </div>
    </div>
  );
}

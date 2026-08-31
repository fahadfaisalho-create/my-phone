'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Stats {
  stores: Partial<Record<'pending' | 'active' | 'rejected' | 'suspended', number>>;
  orders: { total: number; paidCount: number; paidRevenue: number };
  bookings: Partial<Record<'pending' | 'accepted' | 'completed' | 'cancelled', number>>;
  subscriptions: { paidCount: number; paidRevenue: number; unpaidCount: number };
  monthlyRevenue: { month: string; subscriptions: number; orders: number }[];
  supportTickets: Partial<Record<'open' | 'in_progress' | 'closed', number>>;
}

const CIRC = 2 * Math.PI * 38;

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
    (stats.stores.pending || 0) + (stats.stores.active || 0) + (stats.stores.rejected || 0) + (stats.stores.suspended || 0);

  const bookingsTotal =
    (stats.bookings.pending || 0) +
    (stats.bookings.accepted || 0) +
    (stats.bookings.completed || 0) +
    (stats.bookings.cancelled || 0);

  const totalRevenue = stats.subscriptions.paidRevenue + stats.orders.paidRevenue;

  // مخطط خطي بسيط للإيراد الشهري (اشتراكات + طلبات) — قيم حقيقية من /admin/stats
  const months = stats.monthlyRevenue;
  const monthTotals = months.map((m) => m.subscriptions + m.orders);
  const maxRevenue = Math.max(...monthTotals, 1);
  const chartW = 560;
  const chartH = 160;
  const stepX = months.length > 1 ? chartW / (months.length - 1) : 0;
  const points = monthTotals.map((v, i) => {
    const x = i * stepX;
    const y = chartH - (v / maxRevenue) * (chartH - 16) - 4;
    return `${x},${y}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `M0,${chartH} L${points.join(' L')} L${chartW},${chartH} Z`;

  // دائرة توزيع حالات المحلات — نسب حقيقية من الأعداد الفعلية
  const active = stats.stores.active || 0;
  const pending = stats.stores.pending || 0;
  const inactive = (stats.stores.rejected || 0) + (stats.stores.suspended || 0);
  const seg = (n: number) => (storesTotal > 0 ? (n / storesTotal) * CIRC : 0);
  const activeLen = seg(active);
  const pendingLen = seg(pending);
  const inactiveLen = seg(inactive);

  return (
    <div>
      <div className="hero-stat">
        <div>
          <div className="label">{t('reports.totalRevenueLabel')}</div>
          <div className="value">{riyal(totalRevenue)}</div>
          <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 8 }}>{t('reports.totalRevenueNote')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="chart-card">
          <h3 style={{ marginBottom: 14 }}>{t('reports.monthlyRevenueHeading')}</h3>
          {maxRevenue <= 1 && monthTotals.every((v) => v === 0) ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('reports.noRevenueYet')}</p>
          ) : (
            <>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 160 }}>
                <line x1="0" y1={chartH * 0.25} x2={chartW} y2={chartH * 0.25} stroke="var(--border)" strokeWidth="1" />
                <line x1="0" y1={chartH * 0.6} x2={chartW} y2={chartH * 0.6} stroke="var(--border)" strokeWidth="1" />
                <path d={areaPath} fill="var(--indigo)" opacity="0.08" />
                <path d={linePath} fill="none" stroke="var(--indigo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                {months.map((m) => (
                  <span key={m.month}>{m.month}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="chart-card">
          <h3 style={{ marginBottom: 14 }}>{t('reports.storeStatusHeading')}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
            <svg viewBox="0 0 100 100" style={{ width: 130, height: 130 }}>
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="13" />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--green)" strokeWidth="13"
                strokeDasharray={`${activeLen} ${CIRC - activeLen}`} strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--amber)" strokeWidth="13"
                strokeDasharray={`${pendingLen} ${CIRC - pendingLen}`} strokeDashoffset={-activeLen} strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50" cy="50" r="38" fill="none" stroke="var(--red)" strokeWidth="13"
                strokeDasharray={`${inactiveLen} ${CIRC - inactiveLen}`} strokeDashoffset={-(activeLen + pendingLen)} strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="47" textAnchor="middle" fontFamily="var(--font-cairo)" fontWeight="800" fontSize="20" fill="var(--ink)">
                {storesTotal}
              </text>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--green)' }} />
              {t('reports.active')} <span style={{ marginRight: 'auto', fontWeight: 600 }}>{active}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--amber)' }} />
              {t('reports.pending')} <span style={{ marginRight: 'auto', fontWeight: 600 }}>{pending}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--red)' }} />
              {t('reports.rejectedOrSuspended')} <span style={{ marginRight: 'auto', fontWeight: 600 }}>{inactive}</span>
            </div>
          </div>
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

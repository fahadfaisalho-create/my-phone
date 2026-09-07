'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Stats {
  branches: number;
  services: number;
  products: number;
  chats: number;
  bookings: number;
  orders: number;
  revenue: {
    total: number;
    thisMonth: number;
    paidOrdersCount: number;
    monthly: { month: string; total: number }[];
  };
}

export default function StatsTab() {
  const { t, locale } = useLocale();
  const numberLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  function riyal(n: number) {
    return `${n.toLocaleString(numberLocale)} ﷼`;
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Stats>('/stores/me/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('stats.loadError'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="err">{error}</div>;
  if (!stats) return <div className="spinner-wrap">{t('common.loading')}</div>;

  const items: { v: number; l: string }[] = [
    { v: stats.branches, l: t('stats.branchesCount') },
    { v: stats.services, l: t('stats.servicesCount') },
    { v: stats.products, l: t('stats.productsCount') },
    { v: stats.chats, l: t('stats.chatsCount') },
    { v: stats.bookings, l: t('stats.bookingsCount') },
    { v: stats.orders, l: t('stats.ordersCount') },
  ];

  // مخطط خطي بسيط للمبيعات آخر 6 أشهر — قيم حقيقية من /stores/me/stats
  const months = stats.revenue.monthly;
  const monthTotals = months.map((m) => m.total);
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
  const noRevenueYet = maxRevenue <= 1 && monthTotals.every((v) => v === 0);

  return (
    <div>
      <div className="hero-stat">
        <div>
          <div className="label">{t('stats.revenueTotal')}</div>
          <div className="value">{riyal(stats.revenue.total)}</div>
          <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 8 }}>{t('stats.revenueFootnote')}</div>
        </div>
      </div>

      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="metric">
          <div className="v">{riyal(stats.revenue.thisMonth)}</div>
          <div className="l">{t('stats.revenueThisMonth')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.revenue.paidOrdersCount}</div>
          <div className="l">{t('stats.revenuePaidOrders')}</div>
        </div>
        <div className="metric">
          <div className="v">{stats.orders}</div>
          <div className="l">{t('stats.ordersCount')}</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14 }}>{t('stats.revenueChartTitle')}</h3>
        {noRevenueYet ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('stats.revenueFootnote')}</p>
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

      <div className="grid3">
        {items.map((it) => (
          <div className="metric" key={it.l}>
            <div className="v">{it.v}</div>
            <div className="l">{it.l}</div>
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: 14 }}>
        {t('stats.footnote')}
      </p>
    </div>
  );
}

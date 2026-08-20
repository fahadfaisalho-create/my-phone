'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Coupon, CouponDiscountType } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function CouponsTab() {
  const { t, tf, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function describeDiscount(c: Coupon) {
    if (c.discountType === 'percentage') {
      const cap = c.maxDiscount ? tf('couponsTab.capSuffix', String(c.maxDiscount)) : '';
      return `${t('couponsTab.discountLabel')} ${c.percentage}%${cap}`;
    }
    return `${t('couponsTab.discountLabel')} ${c.fixedAmount} ﷼`;
  }

  function couponStatus(c: Coupon): { label: string; cls: string } {
    if (!c.active) return { label: t('couponsTab.statusDisabled'), cls: 'b-rejected' };
    const now = new Date();
    if (c.expiresAt && new Date(c.expiresAt) < now) return { label: t('couponsTab.statusExpired'), cls: 'b-rejected' };
    if (c.startsAt && new Date(c.startsAt) > now) return { label: t('couponsTab.statusNotStarted'), cls: 'b-pending' };
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: t('couponsTab.statusDepleted'), cls: 'b-rejected' };
    return { label: t('couponsTab.statusActive'), cls: 'b-active' };
  }

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [percentage, setPercentage] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Coupon[]>('/stores/me/coupons');
      setCoupons(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('couponsTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setCode('');
    setPercentage('');
    setFixedAmount('');
    setMaxDiscount('');
    setStartsAt('');
    setExpiresAt('');
    setUsageLimit('');
  }

  async function handleCreate() {
    if (!code.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/stores/me/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          percentage: discountType === 'percentage' ? Number(percentage) : undefined,
          fixedAmount: discountType === 'fixed' ? Number(fixedAmount) : undefined,
          maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
          startsAt: startsAt || undefined,
          expiresAt: expiresAt || undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
        }),
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('couponsTab.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await apiFetch(`/stores/me/coupons/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('couponsTab.updateError'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('couponsTab.deleteConfirm'))) return;
    try {
      await apiFetch(`/stores/me/coupons/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('couponsTab.deleteError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>{t('couponsTab.createHeading')}</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          {t('couponsTab.createNote')}
        </p>
        <div className="row2">
          <input placeholder={t('couponsTab.codePlaceholder')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}>
            <option value="percentage">{t('couponsTab.discountPercentage')}</option>
            <option value="fixed">{t('couponsTab.discountFixed')}</option>
          </select>
        </div>

        <div className="row2">
          {discountType === 'percentage' ? (
            <input
              type="number"
              min="1"
              max="100"
              placeholder={t('couponsTab.percentagePlaceholder')}
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          ) : (
            <input
              type="number"
              min="0.01"
              placeholder={t('couponsTab.fixedAmountPlaceholder')}
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
            />
          )}
          {discountType === 'percentage' && (
            <input
              type="number"
              min="0"
              placeholder={t('couponsTab.maxDiscountPlaceholder')}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          )}
        </div>

        <div className="row2">
          <div>
            <label htmlFor="mStartsAt">{t('couponsTab.startsAt')}</label>
            <input id="mStartsAt" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="mExpiresAt">{t('couponsTab.expiresAt')}</label>
            <input id="mExpiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <label htmlFor="mUsageLimit">{t('couponsTab.usageLimit')}</label>
        <input
          id="mUsageLimit"
          type="number"
          min="1"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder={t('couponsTab.usageLimitPlaceholder')}
        />

        {error && <div className="err">{error}</div>}
        <button
          className="primary"
          onClick={handleCreate}
          disabled={saving || !code.trim() || (discountType === 'percentage' ? !percentage : !fixedAmount)}
        >
          {saving ? t('common.saving') : t('couponsTab.create')}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>
          {t('couponsTab.listHeading')} {!loading && `(${coupons.length})`}
        </h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : coupons.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('couponsTab.empty')}</p>
        ) : (
          coupons.map((c) => {
            const status = couponStatus(c);
            return (
              <div className="rowline" key={c.id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <b style={{ fontFamily: 'var(--font-cairo)' }}>{c.code}</b>{' '}
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{describeDiscount(c)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {c.startsAt && `${t('couponsTab.from')} ${formatDate(c.startsAt)} `}
                    {c.expiresAt && `${t('couponsTab.until')} ${formatDate(c.expiresAt)} `}
                    ·{' '}
                    {tf(
                      'couponsTab.usedCount',
                      String(c.usedCount),
                      c.usageLimit ? ` / ${c.usageLimit}` : t('couponsTab.timesSuffix'),
                    )}
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="link" onClick={() => toggleActive(c)}>
                    {c.active ? t('couponsTab.disable') : t('couponsTab.enable')}
                  </button>
                  <button className="link" onClick={() => handleDelete(c.id)}>
                    {t('common.delete')}
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { COUPON_SCOPE_LABEL, COUPON_SCOPE_LABEL_EN, Coupon, CouponDiscountType, CouponScope } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function CouponsSection() {
  const { t, tf, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function describeDiscount(c: Coupon) {
    if (c.discountType === 'percentage') {
      const cap = c.maxDiscount ? tf('coupons.capSuffix', String(c.maxDiscount)) : '';
      return `${t('coupons.discountLabel')} ${c.percentage}%${cap}`;
    }
    return `${t('coupons.discountLabel')} ${c.fixedAmount} ﷼`;
  }

  function couponStatus(c: Coupon): { label: string; cls: string } {
    if (!c.active) return { label: t('coupons.statusDisabled'), cls: 'b-rejected' };
    const now = new Date();
    if (c.expiresAt && new Date(c.expiresAt) < now) return { label: t('coupons.statusExpired'), cls: 'b-rejected' };
    if (c.startsAt && new Date(c.startsAt) > now) return { label: t('coupons.statusNotStarted'), cls: 'b-pending' };
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: t('coupons.statusDepleted'), cls: 'b-rejected' };
    return { label: t('coupons.statusActive'), cls: 'b-active' };
  }

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [percentage, setPercentage] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [scope, setScope] = useState<CouponScope>('orders');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Coupon[]>('/admin/coupons');
      setCoupons(data);
      setSelectedId((prev) => (prev && data.some((c) => c.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('coupons.loadError'));
    } finally {
      setLoading(false);
    }
  }

  const selected = coupons.find((c) => c.id === selectedId) ?? null;

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
      await apiFetch('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          percentage: discountType === 'percentage' ? Number(percentage) : undefined,
          fixedAmount: discountType === 'fixed' ? Number(fixedAmount) : undefined,
          maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
          scope,
          startsAt: startsAt || undefined,
          expiresAt: expiresAt || undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
        }),
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('coupons.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await apiFetch(`/admin/coupons/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('coupons.updateError'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('coupons.deleteConfirm'))) return;
    try {
      await apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('coupons.deleteError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>{t('coupons.createHeading')}</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          {t('coupons.createNote')}
        </p>
        <div className="row2">
          <div>
            <label htmlFor="code">{t('coupons.code')}</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('coupons.codePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="scope">{t('coupons.scope')}</label>
            <select id="scope" value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
              <option value="orders">{t('coupons.scopeOrders')}</option>
              <option value="subscriptions">{t('coupons.scopeSubscriptions')}</option>
              <option value="both">{t('coupons.scopeBoth')}</option>
            </select>
          </div>
        </div>

        <div className="row2">
          <div>
            <label htmlFor="discountType">{t('coupons.discountType')}</label>
            <select
              id="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
            >
              <option value="percentage">{t('coupons.discountPercentage')}</option>
              <option value="fixed">{t('coupons.discountFixed')}</option>
            </select>
          </div>
          {discountType === 'percentage' ? (
            <div>
              <label htmlFor="percentage">{t('coupons.percentage')}</label>
              <input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: 25' : 'e.g. 25'}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="fixedAmount">{t('coupons.fixedAmount')}</label>
              <input
                id="fixedAmount"
                type="number"
                min="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: 20' : 'e.g. 20'}
              />
            </div>
          )}
        </div>

        {discountType === 'percentage' && (
          <>
            <label htmlFor="maxDiscount">{t('coupons.maxDiscount')}</label>
            <input
              id="maxDiscount"
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder={t('coupons.maxDiscountPlaceholder')}
            />
          </>
        )}

        <div className="row2">
          <div>
            <label htmlFor="startsAt">{t('coupons.startsAt')}</label>
            <input id="startsAt" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="expiresAt">{t('coupons.expiresAt')}</label>
            <input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <label htmlFor="usageLimit">{t('coupons.usageLimit')}</label>
        <input
          id="usageLimit"
          type="number"
          min="1"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder={t('coupons.usageLimitPlaceholder')}
        />

        {error && <div className="err">{error}</div>}
        <button
          className="primary"
          onClick={handleCreate}
          disabled={
            saving || !code.trim() || (discountType === 'percentage' ? !percentage : !fixedAmount)
          }
        >
          {saving ? t('common.saving') : t('coupons.create')}
        </button>
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('coupons.listHeading')} {!loading && `(${coupons.length})`}
      </h3>

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('coupons.listHeading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{coupons.length}</span>
            </div>
            <div className="split-list-body">
              {coupons.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('coupons.empty')}</p>
              )}
              {coupons.map((c) => {
                const status = couponStatus(c);
                return (
                  <div
                    key={c.id}
                    className={`split-list-item ${c.id === selectedId ? 'on' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontFamily: 'var(--font-cairo)', fontSize: 13.5, color: 'var(--ink)' }}>{c.code}</b>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{describeDiscount(c)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              {(() => {
                const status = couponStatus(selected);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                      <b style={{ fontFamily: 'var(--font-cairo)', fontSize: 18 }}>{selected.code}</b>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </div>

                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 13 }}>
                      <div style={{ marginBottom: 6 }}>{describeDiscount(selected)}</div>
                      <div style={{ color: 'var(--muted)' }}>
                        {(locale === 'ar' ? COUPON_SCOPE_LABEL : COUPON_SCOPE_LABEL_EN)[selected.scope]}
                      </div>
                    </div>

                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
                      {selected.startsAt && `${t('coupons.from')} ${formatDate(selected.startsAt)} `}
                      {selected.expiresAt && `${t('coupons.until')} ${formatDate(selected.expiresAt)} `}
                      {(selected.startsAt || selected.expiresAt) && '· '}
                      {tf(
                        'coupons.usedCount',
                        String(selected.usedCount),
                        selected.usageLimit ? ` / ${selected.usageLimit}` : t('coupons.timesSuffix'),
                      )}
                    </div>

                    <div className="detail-actions">
                      <button className="btn-lg primary" onClick={() => toggleActive(selected)}>
                        {selected.active ? t('coupons.disable') : t('coupons.enable')}
                      </button>
                      <button className="btn-lg outline-red" onClick={() => handleDelete(selected.id)}>
                        {t('coupons.delete')}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="split-empty">{t('coupons.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

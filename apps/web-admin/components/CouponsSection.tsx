'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { COUPON_SCOPE_LABEL, Coupon, CouponDiscountType, CouponScope } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function describeDiscount(c: Coupon) {
  if (c.discountType === 'percentage') {
    const cap = c.maxDiscount ? ` (بحد أقصى ${c.maxDiscount} ﷼)` : '';
    return `خصم ${c.percentage}%${cap}`;
  }
  return `خصم ${c.fixedAmount} ﷼`;
}

function couponStatus(c: Coupon): { label: string; cls: string } {
  if (!c.active) return { label: 'موقوف', cls: 'b-rejected' };
  const now = new Date();
  if (c.expiresAt && new Date(c.expiresAt) < now) return { label: 'منتهي', cls: 'b-rejected' };
  if (c.startsAt && new Date(c.startsAt) > now) return { label: 'لم يبدأ بعد', cls: 'b-pending' };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: 'استُنفد', cls: 'b-rejected' };
  return { label: 'فعّال', cls: 'b-active' };
}

export default function CouponsSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      setError(err instanceof ApiError ? err.message : 'تعذّر إنشاء الكوبون');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await apiFetch(`/admin/coupons/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الكوبون');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الكوبون نهائياً؟')) return;
    try {
      await apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف الكوبون');
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>إنشاء كوبون خصم عام</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          يعمل هذا الكوبون على كل المتاجر بالمنصة. اختر نطاقه: طلبات شراء المستهلكين، اشتراكات المحلات بالمنصة، أو
          كلاهما.
        </p>
        <div className="row2">
          <div>
            <label htmlFor="code">كود الكوبون</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثال: WELCOME25"
            />
          </div>
          <div>
            <label htmlFor="scope">نطاق التطبيق</label>
            <select id="scope" value={scope} onChange={(e) => setScope(e.target.value as CouponScope)}>
              <option value="orders">طلبات الشراء فقط</option>
              <option value="subscriptions">اشتراكات المحلات فقط</option>
              <option value="both">طلبات الشراء + الاشتراكات</option>
            </select>
          </div>
        </div>

        <div className="row2">
          <div>
            <label htmlFor="discountType">نوع الخصم</label>
            <select
              id="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
            >
              <option value="percentage">نسبة مئوية</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </div>
          {discountType === 'percentage' ? (
            <div>
              <label htmlFor="percentage">النسبة (%)</label>
              <input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="مثال: 25"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="fixedAmount">المبلغ الثابت (﷼)</label>
              <input
                id="fixedAmount"
                type="number"
                min="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="مثال: 20"
              />
            </div>
          )}
        </div>

        {discountType === 'percentage' && (
          <>
            <label htmlFor="maxDiscount">حد أقصى لمبلغ الخصم (اختياري، ﷼)</label>
            <input
              id="maxDiscount"
              type="number"
              min="0"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="مثال: 20 — يعني 25% لكن لا يتجاوز 20 ﷼"
            />
          </>
        )}

        <div className="row2">
          <div>
            <label htmlFor="startsAt">تاريخ البداية (اختياري)</label>
            <input id="startsAt" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="expiresAt">تاريخ الانتهاء (اختياري)</label>
            <input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <label htmlFor="usageLimit">حد أقصى لعدد مرات الاستخدام (اختياري)</label>
        <input
          id="usageLimit"
          type="number"
          min="1"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="بدون حد إذا تُرك فارغاً"
        />

        {error && <div className="err">{error}</div>}
        <button
          className="primary"
          onClick={handleCreate}
          disabled={
            saving || !code.trim() || (discountType === 'percentage' ? !percentage : !fixedAmount)
          }
        >
          {saving ? 'جارٍ الحفظ...' : 'إنشاء الكوبون'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>الكوبونات العامة {!loading && `(${coupons.length})`}</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : coupons.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد كوبونات بعد</p>
        ) : (
          coupons.map((c) => {
            const status = couponStatus(c);
            return (
              <div className="rowline" key={c.id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <b style={{ fontFamily: 'var(--font-cairo)' }}>{c.code}</b>{' '}
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {describeDiscount(c)} · {COUPON_SCOPE_LABEL[c.scope]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {c.startsAt && `من ${formatDate(c.startsAt)} `}
                    {c.expiresAt && `حتى ${formatDate(c.expiresAt)} `}
                    · استُخدم {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ' مرة'}
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="link" onClick={() => toggleActive(c)}>
                    {c.active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button className="link" onClick={() => handleDelete(c.id)}>
                    حذف
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

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { StoreAd } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function adStatus(ad: StoreAd): { label: string; cls: string } {
  if (!ad.paidAt) return { label: 'غير مدفوع', cls: 'b-pending' };
  if (ad.expiresAt && new Date(ad.expiresAt) < new Date()) return { label: 'منتهي', cls: 'b-rejected' };
  return { label: 'نشط', cls: 'b-active' };
}

function daysLeft(ad: StoreAd): number | null {
  if (!ad.paidAt || !ad.expiresAt) return null;
  const ms = new Date(ad.expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function AdsTab() {
  const [ads, setAds] = useState<StoreAd[]>([]);
  const [dailyRate, setDailyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [days, setDays] = useState('7');
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [rate, list] = await Promise.all([
        apiFetch<{ adDailyRate: number }>('/stores/me/ads/rate'),
        apiFetch<StoreAd[]>('/stores/me/ads'),
      ]);
      setDailyRate(rate.adDailyRate);
      setAds(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeAd = ads.find((a) => a.paidAt && a.expiresAt && new Date(a.expiresAt) > new Date());
  const daysNum = Number(days) || 0;
  const estimatedTotal = dailyRate !== null ? dailyRate * daysNum : null;

  async function handleCreate() {
    if (!daysNum || daysNum < 1) return;
    setCreating(true);
    setError('');
    try {
      await apiFetch('/stores/me/ads', { method: 'POST', body: JSON.stringify({ days: daysNum }) });
      setDays('7');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إنشاء الإعلان');
    } finally {
      setCreating(false);
    }
  }

  async function handlePay(id: string) {
    setPayingId(id);
    setPayError('');
    try {
      await apiFetch(`/stores/me/ads/${id}/confirm-payment`, { method: 'POST' });
      await load();
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'تعذّر تأكيد الدفع');
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <div className="spinner-wrap">جارٍ التحميل...</div>;

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>إعلان مميز بالصفحة الرئيسية</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          اشترِ عدد أيام يظهر خلالها متجرك بشريط "إعلانات مميزة" أعلى الصفحة الرئيسية بتطبيق المستهلك. السعر
          الحالي لليوم الواحد: <b>{dailyRate ?? '—'} ﷼</b>. تبدأ مدة الإعلان من لحظة الدفع الفعلي.
        </p>

        {activeAd ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            لديك إعلان نشط حالياً حتى {activeAd.expiresAt && formatDate(activeAd.expiresAt)} (متبقي{' '}
            {daysLeft(activeAd)} يوم). يمكنك شراء إعلان جديد يبدأ بعد انتهاء الحالي.
          </p>
        ) : (
          <>
            <div className="row2">
              <div>
                <label htmlFor="days">عدد أيام الإعلان</label>
                <input
                  id="days"
                  type="number"
                  min="1"
                  max="90"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <div>
                <label>الإجمالي المتوقع</label>
                <div style={{ padding: '10px 0', fontWeight: 700 }}>
                  {estimatedTotal !== null ? `${estimatedTotal} ﷼` : '—'}
                </div>
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <button className="primary" onClick={handleCreate} disabled={creating || !daysNum || daysNum < 1}>
              {creating ? 'جارٍ الإنشاء...' : 'إنشاء طلب إعلان'}
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>إعلاناتك {!loading && `(${ads.length})`}</h3>
        {payError && <div className="err">{payError}</div>}
        {ads.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد إعلانات بعد</p>
        ) : (
          ads.map((ad) => {
            const status = adStatus(ad);
            return (
              <div className="rowline" key={ad.id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <b>{ad.days} يوم</b> <span className={`badge ${status.cls}`}>{status.label}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {ad.dailyRate} ﷼/يوم · الإجمالي {ad.totalPrice} ﷼
                  </div>
                  {ad.paidAt && ad.expiresAt && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      من {formatDate(ad.paidAt)} حتى {formatDate(ad.expiresAt)}
                    </div>
                  )}
                </div>
                {!ad.paidAt && (
                  <button className="primary" onClick={() => handlePay(ad.id)} disabled={payingId === ad.id}>
                    {payingId === ad.id ? 'جارٍ الدفع...' : 'ادفع الآن'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

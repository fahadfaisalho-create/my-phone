'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl, CONSUMER_APP_ORIGIN } from '@/lib/api';
import { Store } from '@/lib/types';
import FileField from '@/components/FileField';

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [copied, setCopied] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [tax, setTax] = useState('');
  const [iban, setIban] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [supportsDelivery, setSupportsDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');

  async function load() {
    try {
      const s = await apiFetch<Store>('/stores/me');
      setStore(s);
      setStoreName(s.name);
      setTax(s.taxNo || '');
      setIban(s.iban);
      setSupportsDelivery(s.supportsDelivery);
      setDeliveryFee(s.deliveryFee || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات المحل');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const form = new FormData();
      form.append('storeName', storeName);
      form.append('iban', iban);
      if (tax) form.append('taxNo', tax);
      if (logo) form.append('logo', logo);
      form.append('supportsDelivery', String(supportsDelivery));
      if (supportsDelivery && deliveryFee) form.append('deliveryFee', deliveryFee);

      const updated = await apiFetch<Store>('/stores/me', { method: 'PATCH', body: form });
      setStore(updated);
      setSupportsDelivery(updated.supportsDelivery);
      setDeliveryFee(updated.deliveryFee || '');
      setLogo(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner-wrap">جارٍ التحميل...</div>;
  if (!store) return null;

  const logoUrl = fileUrl(store.logoUrl);
  const storeLink = `${CONSUMER_APP_ORIGIN}/store/${store.id}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(storeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // بعض المتصفحات تمنع الوصول للحافظة بدون HTTPS — نتجاهل بصمت، الرابط ظاهر أصلاً للنسخ اليدوي
    }
  }

  return (
    <>
      <div className="card card-narrow">
        <h3 style={{ marginBottom: 8 }}>رابط مشاركة المحل</h3>
        <p className="note" style={{ marginBottom: 10 }}>
          شارك هذا الرابط مع عملائك — يفتح مباشرة على صفحة محلك داخل التطبيق، حتى لو ما كانوا مسجّلين دخول.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input readOnly value={storeLink} style={{ flex: 1, minWidth: 220 }} onFocus={(e) => e.target.select()} />
          <button type="button" className="secondary" onClick={handleCopyLink}>
            {copied ? '✓ تم النسخ' : '📋 نسخ الرابط'}
          </button>
        </div>
      </div>

      <form className="card card-narrow" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 12 }}>{store.providerType === 'individual' ? 'إعداداتي' : 'إعدادات المحل'}</h3>

      <div className="filebox">
        <label>{store.providerType === 'individual' ? 'صورتك الحالية' : 'شعار المحل الحالي'}</label>
        {logoUrl ? (
          <img src={logoUrl} alt="الصورة الحالية" className="filepreview-img" style={{ marginBottom: 8 }} />
        ) : (
          <p className="note">لا يوجد شعار مرفوع بعد</p>
        )}
      </div>
      <FileField
        label={store.providerType === 'individual' ? 'تغيير الصورة' : 'تغيير الشعار'}
        accept="image/*"
        file={logo}
        onChange={setLogo}
        previewAsImage
      />

      <label htmlFor="storeName">{store.providerType === 'individual' ? 'اسمك المهني' : 'اسم المحل'}</label>
      <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />

      <label htmlFor="tax">الرقم الضريبي (اختياري)</label>
      <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />

      <label htmlFor="iban">رقم الآيبان</label>
      <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

      {store.providerType !== 'individual' && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={supportsDelivery}
              onChange={(e) => setSupportsDelivery(e.target.checked)}
            />
            🚚 تفعيل خدمة التوصيل للطلبات
          </label>
          {supportsDelivery && (
            <>
              <label htmlFor="deliveryFee">رسوم التوصيل (اختياري، ﷼)</label>
              <input
                id="deliveryFee"
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="بدون رسوم إضافية"
              />
              <p className="note">
                التوصيل حالياً يدوي — المستهلك يختار شركة الشحن (أرامكس أو فيدكس) وعنوانه، وتصلك هذي البيانات مع
                الطلب وترتب الشحن بنفسك، لين نربط التوصيل تلقائياً بالتطبيق لاحقاً.
              </p>
            </>
          )}
        </>
      )}

      <p className="note" style={{ marginTop: 8 }}>
        {store.providerType === 'individual'
          ? 'لتعديل بيانات الهوية أو ملف تصديق الحساب البنكي، تواصل مع الدعم — هذه البيانات تحتاج مراجعة إدارية.'
          : 'لتعديل السجل التجاري أو ملف تصديق الحساب البنكي، تواصل مع الدعم — هذه البيانات تحتاج مراجعة إدارية.'}
      </p>

      {error && <div className="err">{error}</div>}
      {success && <div className="note" style={{ color: 'var(--ink)' }}>✓ تم حفظ التعديلات بنجاح</div>}

      <button className="primary" type="submit" style={{ width: '100%', marginTop: 10 }} disabled={saving}>
        {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>
      </form>
    </>
  );
}

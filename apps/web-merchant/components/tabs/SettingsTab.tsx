'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { Store } from '@/lib/types';
import FileField from '@/components/FileField';

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<Store | null>(null);

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

  return (
    <form className="card card-narrow" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 12 }}>إعدادات المحل</h3>

      <div className="filebox">
        <label>شعار المحل الحالي</label>
        {logoUrl ? (
          <img src={logoUrl} alt="الشعار الحالي" className="filepreview-img" style={{ marginBottom: 8 }} />
        ) : (
          <p className="note">لا يوجد شعار مرفوع بعد</p>
        )}
      </div>
      <FileField label="تغيير الشعار" accept="image/*" file={logo} onChange={setLogo} previewAsImage />

      <label htmlFor="storeName">اسم المحل</label>
      <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />

      <label htmlFor="tax">الرقم الضريبي (اختياري)</label>
      <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />

      <label htmlFor="iban">رقم الآيبان</label>
      <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

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
            التوصيل حالياً يدوي — بيانات الطلب وعنوان المستهلك تصلك، وترتب الشحن بنفسك (عبر أرامكس مثلاً) لين نربط
            التوصيل تلقائياً بالتطبيق لاحقاً.
          </p>
        </>
      )}

      <p className="note" style={{ marginTop: 8 }}>
        لتعديل السجل التجاري أو ملف تصديق الحساب البنكي، تواصل مع الدعم — هذه البيانات تحتاج مراجعة إدارية.
      </p>

      {error && <div className="err">{error}</div>}
      {success && <div className="note" style={{ color: 'var(--ink)' }}>✓ تم حفظ التعديلات بنجاح</div>}

      <button className="primary" type="submit" style={{ width: '100%', marginTop: 10 }} disabled={saving}>
        {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>
    </form>
  );
}

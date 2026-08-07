'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, fileUrl, getToken } from '@/lib/api';
import { Store } from '@/lib/types';
import FileField from '@/components/FileField';

export default function EditStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [store, setStore] = useState<Store | null>(null);

  const [storeName, setStoreName] = useState('');
  const [cr, setCr] = useState('');
  const [tax, setTax] = useState('');
  const [iban, setIban] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [crFile, setCrFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/entry');
      return;
    }
    (async () => {
      try {
        const s = await apiFetch<Store>('/stores/me');
        setStore(s);
        setStoreName(s.name);
        setCr(s.commercialRegisterNo);
        setTax(s.taxNo || '');
        setIban(s.iban);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات المحل');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const form = new FormData();
      form.append('storeName', storeName);
      form.append('commercialRegisterNo', cr);
      form.append('iban', iban);
      if (tax) form.append('taxNo', tax);
      if (logo) form.append('logo', logo);
      if (crFile) form.append('crFile', crFile);
      if (bankFile) form.append('bankFile', bankFile);

      await apiFetch('/stores/me', { method: 'PATCH', body: form });
      router.replace('/pending');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="app spinner-wrap">جارٍ التحميل...</div>;
  if (!store) return null;

  return (
    <div className="app">
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 40 }}>
        <h2>تعديل بيانات المحل وإعادة الإرسال</h2>
        {store.rejectionReason && (
          <div className="note">سبب الرفض السابق: {store.rejectionReason}</div>
        )}
        <label htmlFor="storeName">اسم المحل</label>
        <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        <label htmlFor="cr">رقم السجل التجاري</label>
        <input id="cr" value={cr} onChange={(e) => setCr(e.target.value)} />
        <label htmlFor="tax">الرقم الضريبي (اختياري)</label>
        <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
        <label htmlFor="iban">رقم الآيبان</label>
        <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

        <FileField label="شعار المحل (استبدال)" accept="image/*" file={logo} onChange={setLogo} previewAsImage />
        <div className="filebox">
          <label>ملف السجل التجاري الحالي</label>
          <a href={fileUrl(store.crFileUrl) || '#'} target="_blank" rel="noreferrer" className="doclink">
            📄 عرض الملف الحالي
          </a>
        </div>
        <FileField
          label="استبدال ملف السجل التجاري"
          accept="image/*,.pdf"
          file={crFile}
          onChange={setCrFile}
        />
        <div className="filebox">
          <label>ملف تصديق الحساب البنكي الحالي</label>
          <a href={fileUrl(store.bankCertificateFileUrl) || '#'} target="_blank" rel="noreferrer" className="doclink">
            📄 عرض الملف الحالي
          </a>
        </div>
        <FileField
          label="استبدال ملف تصديق الحساب البنكي"
          accept="image/*,.pdf"
          file={bankFile}
          onChange={setBankFile}
        />

        {error && <div className="err">{error}</div>}
        <button className="primary" type="submit" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'جارٍ الإرسال...' : 'حفظ وإعادة الإرسال للمراجعة'}
        </button>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="link" onClick={() => router.push('/rejected')}>
            رجوع
          </button>
        </div>
      </form>
    </div>
  );
}

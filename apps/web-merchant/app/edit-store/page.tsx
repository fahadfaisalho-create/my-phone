'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, fileUrl, getToken } from '@/lib/api';
import { Store } from '@/lib/types';
import FileField from '@/components/FileField';
import { useLocale } from '@/lib/i18n';

export default function EditStorePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [store, setStore] = useState<Store | null>(null);

  const [storeName, setStoreName] = useState('');
  const [cr, setCr] = useState('');
  const [nationalId, setNationalId] = useState('');
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
        setCr(s.commercialRegisterNo || '');
        setNationalId(s.nationalId || '');
        setTax(s.taxNo || '');
        setIban(s.iban);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('editStore.loadError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const form = new FormData();
      form.append('storeName', storeName);
      if (store?.providerType === 'individual') {
        form.append('nationalId', nationalId);
      } else {
        form.append('commercialRegisterNo', cr);
      }
      form.append('iban', iban);
      if (tax) form.append('taxNo', tax);
      if (logo) form.append('logo', logo);
      if (crFile) form.append('crFile', crFile);
      if (bankFile) form.append('bankFile', bankFile);

      await apiFetch('/stores/me', { method: 'PATCH', body: form });
      router.replace('/pending');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('editStore.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="app spinner-wrap">{t('common.loading')}</div>;
  if (!store) return null;

  const isIndividual = store.providerType === 'individual';

  return (
    <div className="app">
      <form className="card card-narrow" onSubmit={handleSubmit} style={{ marginTop: 40 }}>
        <h2>{t('editStore.heading')}</h2>
        {store.rejectionReason && (
          <div className="note">
            {t('editStore.previousRejectionReason')}: {store.rejectionReason}
          </div>
        )}
        <label htmlFor="storeName">{isIndividual ? t('editStore.nameIndividual') : t('editStore.nameStore')}</label>
        <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        {isIndividual ? (
          <>
            <label htmlFor="nationalId">{t('editStore.nationalId')}</label>
            <input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </>
        ) : (
          <>
            <label htmlFor="cr">{t('editStore.crNo')}</label>
            <input id="cr" value={cr} onChange={(e) => setCr(e.target.value)} />
          </>
        )}
        <label htmlFor="tax">{t('editStore.taxNoOptional')}</label>
        <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
        <label htmlFor="iban">{t('editStore.iban')}</label>
        <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

        <FileField
          label={isIndividual ? t('editStore.replacePhoto') : t('editStore.replaceLogo')}
          accept="image/*"
          file={logo}
          onChange={setLogo}
          previewAsImage
        />
        <div className="filebox">
          <label>{isIndividual ? t('editStore.currentIdFile') : t('editStore.currentCrFile')}</label>
          <a href={fileUrl(store.crFileUrl) || '#'} target="_blank" rel="noreferrer" className="doclink">
            {t('editStore.viewCurrentFile')}
          </a>
        </div>
        <FileField
          label={isIndividual ? t('editStore.replaceIdFile') : t('editStore.replaceCrFile')}
          accept="image/*,.pdf"
          file={crFile}
          onChange={setCrFile}
        />
        <div className="filebox">
          <label>{t('editStore.currentBankFile')}</label>
          <a href={fileUrl(store.bankCertificateFileUrl) || '#'} target="_blank" rel="noreferrer" className="doclink">
            {t('editStore.viewCurrentFile')}
          </a>
        </div>
        <FileField
          label={t('editStore.replaceBankFile')}
          accept="image/*,.pdf"
          file={bankFile}
          onChange={setBankFile}
        />

        {error && <div className="err">{error}</div>}
        <button className="primary" type="submit" style={{ width: '100%' }} disabled={saving}>
          {saving ? t('editStore.submitting') : t('editStore.saveAndResend')}
        </button>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="link" onClick={() => router.push('/rejected')}>
            {t('editStore.back')}
          </button>
        </div>
      </form>
    </div>
  );
}

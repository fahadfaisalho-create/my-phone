'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl, CONSUMER_APP_ORIGIN } from '@/lib/api';
import { DeliveryAgent, Store } from '@/lib/types';
import FileField from '@/components/FileField';
import DeliveryZonePicker from '@/components/DeliveryZonePicker';
import { useLocale } from '@/lib/i18n';

export default function SettingsTab() {
  const { t } = useLocale();
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

  // توصيل داخلي بمناديب المحل
  const [supportsAgentDelivery, setSupportsAgentDelivery] = useState(false);
  const [agentZoneLat, setAgentZoneLat] = useState<number | null>(null);
  const [agentZoneLng, setAgentZoneLng] = useState<number | null>(null);
  const [agentZoneRadiusKm, setAgentZoneRadiusKm] = useState('');
  const [agentDeliveryFee, setAgentDeliveryFee] = useState('');

  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentError, setAgentError] = useState('');

  async function load() {
    try {
      const s = await apiFetch<Store>('/stores/me');
      setStore(s);
      setStoreName(s.name);
      setTax(s.taxNo || '');
      setIban(s.iban);
      setSupportsDelivery(s.supportsDelivery);
      setDeliveryFee(s.deliveryFee || '');
      setSupportsAgentDelivery(s.supportsAgentDelivery);
      setAgentZoneLat(s.agentZoneLat);
      setAgentZoneLng(s.agentZoneLng);
      setAgentZoneRadiusKm(s.agentZoneRadiusKm != null ? String(s.agentZoneRadiusKm) : '');
      setAgentDeliveryFee(s.agentDeliveryFee || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const data = await apiFetch<DeliveryAgent[]>('/stores/me/delivery-agents');
      setAgents(data);
    } catch {
      // قائمة المناديب اختيارية — تجاهل صامت لو فشل التحميل، القسم الرئيسي بالإعدادات لسه شغال
    } finally {
      setAgentsLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (supportsAgentDelivery && (agentZoneLat === null || agentZoneLng === null || !agentZoneRadiusKm || !agentDeliveryFee)) {
      setError(t('settings.agentZoneMissing'));
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('storeName', storeName);
      form.append('iban', iban);
      if (tax) form.append('taxNo', tax);
      if (logo) form.append('logo', logo);
      form.append('supportsDelivery', String(supportsDelivery));
      if (supportsDelivery && deliveryFee) form.append('deliveryFee', deliveryFee);
      form.append('supportsAgentDelivery', String(supportsAgentDelivery));
      if (supportsAgentDelivery) {
        form.append('agentZoneLat', String(agentZoneLat));
        form.append('agentZoneLng', String(agentZoneLng));
        form.append('agentZoneRadiusKm', agentZoneRadiusKm);
        form.append('agentDeliveryFee', agentDeliveryFee);
      }

      const updated = await apiFetch<Store>('/stores/me', { method: 'PATCH', body: form });
      setStore(updated);
      setSupportsDelivery(updated.supportsDelivery);
      setDeliveryFee(updated.deliveryFee || '');
      setSupportsAgentDelivery(updated.supportsAgentDelivery);
      setAgentZoneLat(updated.agentZoneLat);
      setAgentZoneLng(updated.agentZoneLng);
      setAgentZoneRadiusKm(updated.agentZoneRadiusKm != null ? String(updated.agentZoneRadiusKm) : '');
      setAgentDeliveryFee(updated.agentDeliveryFee || '');
      setLogo(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAgent() {
    if (!agentName.trim() || !agentPhone.trim()) return;
    setAgentSaving(true);
    setAgentError('');
    try {
      await apiFetch('/stores/me/delivery-agents', {
        method: 'POST',
        body: JSON.stringify({ name: agentName.trim(), phone: agentPhone.trim() }),
      });
      setAgentName('');
      setAgentPhone('');
      await loadAgents();
    } catch (err) {
      setAgentError(err instanceof ApiError ? err.message : t('settings.addAgentError'));
    } finally {
      setAgentSaving(false);
    }
  }

  async function handleRemoveAgent(id: string) {
    try {
      await apiFetch(`/stores/me/delivery-agents/${id}`, { method: 'DELETE' });
      await loadAgents();
    } catch (err) {
      setAgentError(err instanceof ApiError ? err.message : t('settings.removeAgentError'));
    }
  }

  if (loading) return <div className="spinner-wrap">{t('common.loading')}</div>;
  if (!store) return null;

  const logoUrl = fileUrl(store.logoUrl);
  const storeLink = `${CONSUMER_APP_ORIGIN}/store/${store.id}`;
  const isIndividual = store.providerType === 'individual';

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
        <h3 style={{ marginBottom: 8 }}>{t('settings.shareLinkHeading')}</h3>
        <p className="note" style={{ marginBottom: 10 }}>
          {t('settings.shareLinkNote')}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input readOnly value={storeLink} style={{ flex: 1, minWidth: 220 }} onFocus={(e) => e.target.select()} />
          <button type="button" className="secondary" onClick={handleCopyLink}>
            {copied ? t('settings.copied') : t('settings.copyLink')}
          </button>
        </div>
      </div>

      <form className="card card-narrow" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 12 }}>{isIndividual ? t('settings.settingsHeadingIndividual') : t('settings.settingsHeadingStore')}</h3>

      <div className="filebox">
        <label>{isIndividual ? t('settings.currentPhotoIndividual') : t('settings.currentPhotoStore')}</label>
        {logoUrl ? (
          <img src={logoUrl} alt={t('settings.currentImageAlt')} className="filepreview-img" style={{ marginBottom: 8 }} />
        ) : (
          <p className="note">{t('settings.noLogoYet')}</p>
        )}
      </div>
      <FileField
        label={isIndividual ? t('settings.changePhotoIndividual') : t('settings.changePhotoStore')}
        accept="image/*"
        file={logo}
        onChange={setLogo}
        previewAsImage
      />

      <label htmlFor="storeName">{isIndividual ? t('settings.nameIndividual') : t('settings.nameStore')}</label>
      <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />

      <label htmlFor="tax">{t('settings.taxNo')}</label>
      <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />

      <label htmlFor="iban">{t('settings.iban')}</label>
      <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

      {!isIndividual && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={supportsDelivery}
              onChange={(e) => setSupportsDelivery(e.target.checked)}
            />
            {t('settings.enableDelivery')}
          </label>
          {supportsDelivery && (
            <>
              <label htmlFor="deliveryFee">{t('settings.deliveryFee')}</label>
              <input
                id="deliveryFee"
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder={t('settings.deliveryFeePlaceholder')}
              />
              <p className="note">{t('settings.deliveryNote')}</p>
            </>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, marginTop: 18 }}>
            <input
              type="checkbox"
              checked={supportsAgentDelivery}
              onChange={(e) => setSupportsAgentDelivery(e.target.checked)}
            />
            {t('settings.enableAgentDelivery')}
          </label>
          {supportsAgentDelivery && (
            <>
              <DeliveryZonePicker
                lat={agentZoneLat}
                lng={agentZoneLng}
                radiusKm={agentZoneRadiusKm ? Number(agentZoneRadiusKm) : null}
                onPick={(la, ln) => {
                  setAgentZoneLat(la);
                  setAgentZoneLng(ln);
                }}
              />
              <div className="row2">
                <div>
                  <label htmlFor="agentRadius">{t('settings.agentRadius')}</label>
                  <input
                    id="agentRadius"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={agentZoneRadiusKm}
                    onChange={(e) => setAgentZoneRadiusKm(e.target.value)}
                    placeholder={t('settings.agentRadiusPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="agentFee">{t('settings.agentFee')}</label>
                  <input
                    id="agentFee"
                    type="number"
                    min="0"
                    value={agentDeliveryFee}
                    onChange={(e) => setAgentDeliveryFee(e.target.value)}
                    placeholder={t('settings.agentFeePlaceholder')}
                  />
                </div>
              </div>
              <p className="note">{t('settings.agentNote')}</p>
            </>
          )}
        </>
      )}

      <p className="note" style={{ marginTop: 8 }}>
        {isIndividual ? t('settings.contactSupportIndividual') : t('settings.contactSupportStore')}
      </p>

      {error && <div className="err">{error}</div>}
      {success && <div className="note" style={{ color: 'var(--ink)' }}>{t('settings.saveSuccess')}</div>}

      <button className="primary" type="submit" style={{ width: '100%', marginTop: 10 }} disabled={saving}>
        {saving ? t('common.saving') : t('settings.saveChanges')}
      </button>
      </form>

      {!isIndividual && (
        <div className="card card-narrow">
          <h3 style={{ marginBottom: 8 }}>{t('settings.agentsHeading')}</h3>
          <p className="note" style={{ marginBottom: 10 }}>
            {t('settings.agentsNote')}
          </p>
          <div className="row2">
            <input placeholder={t('settings.agentNamePlaceholder')} value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            <input placeholder={t('settings.agentPhonePlaceholder')} value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} />
          </div>
          {agentError && <div className="err">{agentError}</div>}
          <button
            className="primary"
            type="button"
            onClick={handleAddAgent}
            disabled={agentSaving || !agentName.trim() || !agentPhone.trim()}
          >
            {agentSaving ? t('common.saving') : t('settings.addAgent')}
          </button>

          <div style={{ marginTop: 16 }}>
            {agentsLoading ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
            ) : agents.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('settings.noAgentsYet')}</p>
            ) : (
              agents.map((a) => (
                <div className="rowline" key={a.id}>
                  <span>{a.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--muted)' }}>{a.phone}</span>
                    <button className="link" onClick={() => handleRemoveAgent(a.id)}>
                      {t('common.delete')}
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

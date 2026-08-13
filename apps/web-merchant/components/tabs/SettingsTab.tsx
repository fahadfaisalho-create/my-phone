'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl, CONSUMER_APP_ORIGIN } from '@/lib/api';
import { DeliveryAgent, Store } from '@/lib/types';
import FileField from '@/components/FileField';
import DeliveryZonePicker from '@/components/DeliveryZonePicker';

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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات المحل');
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
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (supportsAgentDelivery && (agentZoneLat === null || agentZoneLng === null || !agentZoneRadiusKm || !agentDeliveryFee)) {
      setError('لتفعيل توصيل مناديب المحل، حدد مركز النطاق بالخريطة ونصف القطر والسعر');
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
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ التعديلات');
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
      setAgentError(err instanceof ApiError ? err.message : 'تعذّر إضافة المندوب');
    } finally {
      setAgentSaving(false);
    }
  }

  async function handleRemoveAgent(id: string) {
    try {
      await apiFetch(`/stores/me/delivery-agents/${id}`, { method: 'DELETE' });
      await loadAgents();
    } catch (err) {
      setAgentError(err instanceof ApiError ? err.message : 'تعذّر حذف المندوب');
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, marginTop: 18 }}>
            <input
              type="checkbox"
              checked={supportsAgentDelivery}
              onChange={(e) => setSupportsAgentDelivery(e.target.checked)}
            />
            🛵 تفعيل التوصيل بمناديب المحل (نطاق جغرافي)
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
                  <label htmlFor="agentRadius">نصف قطر النطاق (كم)</label>
                  <input
                    id="agentRadius"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={agentZoneRadiusKm}
                    onChange={(e) => setAgentZoneRadiusKm(e.target.value)}
                    placeholder="مثال: 10"
                  />
                </div>
                <div>
                  <label htmlFor="agentFee">سعر توصيل المندوب (﷼)</label>
                  <input
                    id="agentFee"
                    type="number"
                    min="0"
                    value={agentDeliveryFee}
                    onChange={(e) => setAgentDeliveryFee(e.target.value)}
                    placeholder="مثال: 15"
                  />
                </div>
              </div>
              <p className="note">
                لما المستهلك يختار "توصيل من المحل" ويحدد موقعه، النظام يتحقق تلقائياً إنه داخل هذا النطاق —
                لو داخله يوصله المندوب خلال 24 ساعة، ولو خارجه ما يقدر يختار هذي الطريقة.
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

      {store.providerType !== 'individual' && (
        <div className="card card-narrow">
          <h3 style={{ marginBottom: 8 }}>مناديب التوصيل</h3>
          <p className="note" style={{ marginBottom: 10 }}>
            أضف الأشخاص اللي يوصلون طلبات محلك — تظهر بياناتهم لك فقط للتنسيق معهم عند وصول طلب توصيل.
          </p>
          <div className="row2">
            <input placeholder="اسم المندوب" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            <input placeholder="رقم الجوال" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} />
          </div>
          {agentError && <div className="err">{agentError}</div>}
          <button
            className="primary"
            type="button"
            onClick={handleAddAgent}
            disabled={agentSaving || !agentName.trim() || !agentPhone.trim()}
          >
            {agentSaving ? 'جارٍ الحفظ...' : 'إضافة مندوب'}
          </button>

          <div style={{ marginTop: 16 }}>
            {agentsLoading ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
            ) : agents.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد مناديب مضافين بعد</p>
            ) : (
              agents.map((a) => (
                <div className="rowline" key={a.id}>
                  <span>{a.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--muted)' }}>{a.phone}</span>
                    <button className="link" onClick={() => handleRemoveAgent(a.id)}>
                      حذف
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

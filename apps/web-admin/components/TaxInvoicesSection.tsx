'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { TaxInvoice, ZATCA_STATUS_BADGE, ZATCA_STATUS_LABEL, ZATCA_STATUS_LABEL_EN, ZatcaStatus } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

interface PlatformSettings {
  id: string;
  adDailyRate: string | number;
  platformLegalName: string | null;
  platformVatNo: string | null;
  platformCrNo: string | null;
}

const TAB_KEYS: { key: ZatcaStatus | 'all'; navKey: string }[] = [
  { key: 'all', navKey: 'invoices.tabAll' },
  { key: 'failed', navKey: 'invoices.tabFailed' },
  { key: 'accepted', navKey: 'invoices.tabAccepted' },
];

function BillingSettingsCard() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [legalName, setLegalName] = useState('');
  const [vatNo, setVatNo] = useState('');
  const [crNo, setCrNo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiFetch<PlatformSettings>('/admin/settings');
        setSettings(s);
        setLegalName(s.platformLegalName ?? '');
        setVatNo(s.platformVatNo ?? '');
        setCrNo(s.platformCrNo ?? '');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('invoices.loadError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const s = await apiFetch<PlatformSettings>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          adDailyRate: Number(settings.adDailyRate),
          platformLegalName: legalName.trim(),
          platformVatNo: vatNo.trim(),
          platformCrNo: crNo.trim(),
        }),
      });
      setSettings(s);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('invoices.loadError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 8 }}>{t('invoices.billingSettingsHeading')}</h3>
      <p className="note" style={{ marginBottom: 12 }}>
        {t('invoices.billingSettingsNote')}
      </p>
      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="row2">
        <div>
          <label htmlFor="platformLegalName">{t('invoices.platformLegalName')}</label>
          <input
            id="platformLegalName"
            value={legalName}
            onChange={(e) => {
              setLegalName(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div>
          <label htmlFor="platformVatNo">{t('invoices.platformVatNo')}</label>
          <input
            id="platformVatNo"
            value={vatNo}
            onChange={(e) => {
              setVatNo(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>
      <div className="row2">
        <div>
          <label htmlFor="platformCrNo">{t('invoices.platformCrNo')}</label>
          <input
            id="platformCrNo"
            value={crNo}
            onChange={(e) => {
              setCrNo(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>
      {saved && <p style={{ color: 'var(--accent, #16a34a)', fontSize: 13 }}>{t('ads.saveSuccess')}</p>}
      <button className="primary" onClick={handleSave} disabled={saving}>
        {saving ? t('common.saving') : t('common.confirm')}
      </button>
    </div>
  );
}

export default function TaxInvoicesSection() {
  const { t, locale } = useLocale();
  const statusLabel = locale === 'ar' ? ZATCA_STATUS_LABEL : ZATCA_STATUS_LABEL_EN;
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const [filter, setFilter] = useState<ZatcaStatus | 'all'>('all');
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      const data = await apiFetch<TaxInvoice[]>(`/admin/tax-invoices${query}`);
      setInvoices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('invoices.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResend(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/admin/tax-invoices/${id}/resend`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('invoices.resendError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <BillingSettingsCard />

      <div className="tabs">
        {TAB_KEYS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
            {t(f.navKey)}
          </button>
        ))}
      </div>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('invoices.heading')} {!loading && `(${invoices.length})`}
      </h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : invoices.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('invoices.empty')}</p>
        </div>
      ) : (
        invoices.map((inv) => (
          <div className="card" key={inv.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontFamily: 'var(--font-cairo)' }}>{inv.invoiceNo}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {inv.store.name} · {inv.order.consumer.name}
                  {inv.order.consumer.phone ? ` · ${inv.order.consumer.phone}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {inv.order.paidAt ? new Date(inv.order.paidAt).toLocaleString(dateLocale) : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 700, color: 'var(--ink)' }}>
                  {inv.total} ﷼
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t('common.vatIncluded')} {inv.vatAmount} ﷼
                </div>
              </div>
            </div>

            <div className="actions-row" style={{ marginTop: 12, alignItems: 'center' }}>
              <span className={`badge ${ZATCA_STATUS_BADGE[inv.status]}`}>{statusLabel[inv.status]}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('invoices.attempts')}: {inv.attempts}
                {inv.lastAttemptAt ? ` · ${t('invoices.lastAttempt')}: ${new Date(inv.lastAttemptAt).toLocaleString(dateLocale)}` : ''}
              </span>
              {(inv.status === 'failed' || inv.status === 'rejected' || inv.status === 'not_sent') && (
                <button className="primary" disabled={busyId === inv.id} onClick={() => handleResend(inv.id)}>
                  {busyId === inv.id ? t('invoices.resending') : t('invoices.resend')}
                </button>
              )}
            </div>

            {inv.lastError && (
              <p style={{ fontSize: 12, color: 'var(--red)', margin: '8px 0 0' }}>
                {t('invoices.lastError')}: {inv.lastError}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

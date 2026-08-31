'use client';

import { useState } from 'react';
import { fileUrl } from '@/lib/api';
import { PLAN_LABEL, PLAN_LABEL_EN, StoreRequest } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export const BADGE_CLASS: Record<string, string> = {
  pending: 'b-pending',
  active: 'b-active',
  rejected: 'b-rejected',
  suspended: 'b-suspended',
};
export const BADGE_NAV_KEY: Record<string, string> = {
  pending: 'stores.tabPending',
  active: 'stores.tabActive',
  rejected: 'stores.tabRejected',
  suspended: 'stores.tabSuspended',
};

function DocLink({ url, label, notAttached }: { url: string | null; label: string; notAttached: string }) {
  if (!url) return <span className="docmissing">{label}: {notAttached}</span>;
  const isImage = /\.(png|jpe?g|webp)$/i.test(url);
  return (
    <a href={url} target="_blank" rel="noreferrer" className="doclink">
      {isImage ? <img src={url} className="docthumb" alt={label} /> : <span>📄</span>}
      <span>{label}</span>
    </a>
  );
}

export default function StoreRequestCard({
  store,
  onApprove,
  onReject,
  onTogglePayment,
  onSuspend,
  onReactivate,
}: {
  store: StoreRequest;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onTogglePayment: (subscriptionId: string, paid: boolean) => Promise<void>;
  onSuspend: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
}) {
  const { t, tf, locale } = useLocale();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const logo = fileUrl(store.logoUrl);
  const sub = store.subscriptions?.[0];
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  async function handleApprove() {
    setBusy(true);
    try {
      await onApprove(store.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await onReject(store.id, reason.trim());
      setShowReject(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  }

  async function handleTogglePayment() {
    if (!sub) return;
    setBusy(true);
    try {
      await onTogglePayment(sub.id, !sub.paidAt);
    } finally {
      setBusy(false);
    }
  }

  async function handleSuspend() {
    if (!confirm(tf('stores.suspendConfirm', store.name))) return;
    setBusy(true);
    try {
      await onSuspend(store.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleReactivate() {
    setBusy(true);
    try {
      await onReactivate(store.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      {/* رأس البطاقة — شعار كبير + اسم + بريد التاجر، والحالة أعلى اليسار (يطابق تصميم "مساحة عمل مركّزة") */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {logo ? (
            <img src={logo} alt={store.name} style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'var(--indigo-bg)',
                color: 'var(--indigo-d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 22,
                fontFamily: 'var(--font-cairo)',
                flexShrink: 0,
              }}
            >
              {store.name.trim()[0] || 'م'}
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
              {store.name}{' '}
              <span className="badge" style={{ background: store.providerType === 'individual' ? '#E8EDF1' : '#F0F0F0', fontWeight: 600 }}>
                {store.providerType === 'individual' ? t('stores.individual') : t('stores.company')}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
              {store.owner.name} · {store.owner.email}
            </div>
          </div>
        </div>
        <span className={`badge ${BADGE_CLASS[store.status]}`}>{t(BADGE_NAV_KEY[store.status])}</span>
      </div>

      {/* شبكة بطاقات صغيرة للأرقام الأساسية — نفس أسلوب مؤشرات صفحة التقارير */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>
            {store.providerType === 'individual' ? t('stores.nationalIdLabel') : t('stores.crLabel')}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
            {(store.providerType === 'individual' ? store.nationalId : store.commercialRegisterNo) ?? '—'}
          </div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('stores.ibanLabel')}</div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{store.iban}</div>
        </div>
        {sub && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('stores.planLabel')}</div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {(locale === 'ar' ? PLAN_LABEL : PLAN_LABEL_EN)[sub.plan]} ({Number(sub.price).toLocaleString(dateLocale)} ﷼)
            </div>
          </div>
        )}
        {store.providerType === 'individual' && (
          <>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('stores.verifiedAtLabel')}</div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {store.verifiedAt ? new Date(store.verifiedAt).toLocaleDateString(dateLocale) : t('stores.notVerifiedYet')}
              </div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('stores.licenseExpiryLabel')}</div>
              <div style={{ fontWeight: 600, color: store.freelanceLicenseExpiry && new Date(store.freelanceLicenseExpiry) < new Date() ? 'var(--red)' : 'var(--ink)' }}>
                {store.freelanceLicenseExpiry ? (
                  <>
                    {new Date(store.freelanceLicenseExpiry).toLocaleDateString(dateLocale)}
                    {new Date(store.freelanceLicenseExpiry) < new Date() ? ` (${t('stores.licenseExpired')})` : ''}
                  </>
                ) : (
                  t('stores.licenseExpiryMissing')
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* المستندات المرفقة */}
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>{t('stores.attachedDocs')}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <DocLink
          url={fileUrl(store.crFileUrl)}
          label={store.providerType === 'individual' ? t('stores.idOrLicense') : t('stores.commercialRegister')}
          notAttached={t('stores.notAttached')}
        />
        <DocLink url={fileUrl(store.bankCertificateFileUrl)} label={t('stores.bankCertificate')} notAttached={t('stores.notAttached')} />
      </div>

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span className={`badge ${sub.paidAt ? 'b-active' : 'b-pending'}`}>
            {sub.paidAt
              ? `${t('stores.invoicePaid')} (${new Date(sub.paidAt).toLocaleDateString(dateLocale)})`
              : t('stores.invoiceUnpaid')}
          </span>
          <button className="link" onClick={handleTogglePayment} disabled={busy}>
            {sub.paidAt ? t('stores.unconfirmPayment') : t('stores.confirmPayment')}
          </button>
        </div>
      )}

      {store.status === 'rejected' && store.rejectionReason && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0 16px' }}>
          {t('stores.rejectionReasonLabel')}: {store.rejectionReason}
        </p>
      )}

      {/* أزرار الإجراءات — pill كبيرة بنفس مقاسات تصميم "مساحة عمل مركّزة" بكل شاشات التفاصيل */}
      {store.status === 'pending' && (
        <div className="detail-actions">
          <button className="btn-lg primary" onClick={handleApprove} disabled={busy}>
            {t('stores.approveRequest')}
          </button>
          <button className="btn-lg outline-red" onClick={() => setShowReject((v) => !v)} disabled={busy}>
            {t('common.reject')}
          </button>
        </div>
      )}

      {store.status === 'active' && (
        <div className="detail-actions">
          <button className="btn-lg outline-red" onClick={handleSuspend} disabled={busy}>
            {t('stores.suspendStore')}
          </button>
        </div>
      )}

      {store.status === 'suspended' && (
        <div className="detail-actions">
          <button className="btn-lg primary" onClick={handleReactivate} disabled={busy}>
            {t('stores.reactivateStore')}
          </button>
        </div>
      )}

      {showReject && (
        <div className="reject-panel">
          <label htmlFor={`reason-${store.id}`}>{t('stores.rejectionReasonLabel')}</label>
          <textarea
            id={`reason-${store.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('stores.rejectionPlaceholder')}
          />
          <div className="actions-row">
            <button className="danger" onClick={handleConfirmReject} disabled={busy || !reason.trim()}>
              {t('stores.confirmReject')}
            </button>
            <button className="secondary" onClick={() => setShowReject(false)} disabled={busy}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

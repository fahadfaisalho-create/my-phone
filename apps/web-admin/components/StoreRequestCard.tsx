'use client';

import { useState } from 'react';
import { fileUrl } from '@/lib/api';
import { PLAN_LABEL, PLAN_LABEL_EN, StoreRequest } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

const BADGE_CLASS: Record<string, string> = {
  pending: 'b-pending',
  active: 'b-active',
  rejected: 'b-rejected',
  suspended: 'b-suspended',
};
const BADGE_NAV_KEY: Record<string, string> = {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logo ? (
            <img src={logo} className="storelogo" alt={store.name} />
          ) : (
            <div
              className="storelogo"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--teal-bg)',
                color: 'var(--teal-d)',
                fontWeight: 700,
                fontFamily: 'var(--font-cairo)',
              }}
            >
              {store.name.trim()[0] || 'م'}
            </div>
          )}
          <div>
            <b>{store.name}</b>{' '}
            <span className="badge" style={{ background: store.providerType === 'individual' ? '#E8EDF1' : '#F0F0F0' }}>
              {store.providerType === 'individual' ? t('stores.individual') : t('stores.company')}
            </span>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {store.owner.name} · {store.owner.email}
            </div>
          </div>
        </div>
        <span className={`badge ${BADGE_CLASS[store.status]}`}>{t(BADGE_NAV_KEY[store.status])}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <DocLink
          url={fileUrl(store.crFileUrl)}
          label={store.providerType === 'individual' ? t('stores.idOrLicense') : t('stores.commercialRegister')}
          notAttached={t('stores.notAttached')}
        />
        <DocLink url={fileUrl(store.bankCertificateFileUrl)} label={t('stores.bankCertificate')} notAttached={t('stores.notAttached')} />
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {store.providerType === 'individual'
          ? `${t('stores.nationalIdLabel')}: ${store.nationalId ?? '—'}`
          : `${t('stores.crLabel')}: ${store.commercialRegisterNo ?? '—'}`}{' '}
        · {t('stores.ibanLabel')}: {store.iban}
        {sub && (
          <>
            {' '}
            · {t('stores.planLabel')}: {(locale === 'ar' ? PLAN_LABEL : PLAN_LABEL_EN)[sub.plan]} ({Number(sub.price).toLocaleString(dateLocale)} ﷼
            {sub.vatAmount ? ` ${t('common.vatIncluded')} ${sub.vatAmount} ﷼` : ''})
          </>
        )}
      </div>

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
        <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0 12px' }}>
          {t('stores.rejectionReasonLabel')}: {store.rejectionReason}
        </p>
      )}

      {store.status === 'pending' && (
        <div className="actions-row">
          <button className="primary" onClick={handleApprove} disabled={busy}>
            {t('common.approve')}
          </button>
          <button
            className="danger"
            onClick={() => setShowReject((v) => !v)}
            disabled={busy}
          >
            {t('common.reject')}
          </button>
        </div>
      )}

      {store.status === 'active' && (
        <div className="actions-row">
          <button className="danger" onClick={handleSuspend} disabled={busy}>
            {t('stores.suspendStore')}
          </button>
        </div>
      )}

      {store.status === 'suspended' && (
        <div className="actions-row">
          <button className="primary" onClick={handleReactivate} disabled={busy}>
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

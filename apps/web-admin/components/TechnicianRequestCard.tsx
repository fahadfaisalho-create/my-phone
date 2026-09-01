'use client';

import { useState } from 'react';
import { fileUrl } from '@/lib/api';
import { TechnicianRequest } from '@/lib/types';
import { DocLink } from '@/components/StoreRequestCard';
import { useLocale } from '@/lib/i18n';

export const BADGE_CLASS: Record<string, string> = {
  pending: 'b-pending',
  approved: 'b-active',
  rejected: 'b-rejected',
};
export const BADGE_NAV_KEY: Record<string, string> = {
  pending: 'technicians.tabPending',
  approved: 'technicians.tabApproved',
  rejected: 'technicians.tabRejected',
};

export default function TechnicianRequestCard({
  technician,
  onApprove,
  onReject,
}: {
  technician: TechnicianRequest;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const { t, locale } = useLocale();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const photo = fileUrl(technician.photoUrl);

  async function handleApprove() {
    setBusy(true);
    try {
      await onApprove(technician.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await onReject(technician.id, reason.trim());
      setShowReject(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {photo ? (
            <img src={photo} alt={technician.name} style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
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
              {technician.name.trim()[0] || 'ف'}
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
              {technician.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
              {t('technicians.storeLabel')}: {technician.store.name}{' '}
              <span className="badge" style={{ background: '#F0F0F0', fontWeight: 600 }}>
                {technician.store.providerType === 'individual' ? t('technicians.individualLabel') : t('technicians.companyLabel')}
              </span>
            </div>
          </div>
        </div>
        <span className={`badge ${BADGE_CLASS[technician.status]}`}>{t(BADGE_NAV_KEY[technician.status])}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('technicians.nationalityLabel')}</div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{technician.nationality}</div>
        </div>
        {technician.experienceYears != null && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('technicians.experienceLabel')}</div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{technician.experienceYears}</div>
          </div>
        )}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('technicians.licenseNoLabel')}</div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{technician.freelanceLicenseNo ?? '—'}</div>
        </div>
        {technician.status !== 'pending' && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('technicians.verifiedAtLabel')}</div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {technician.verifiedAt ? new Date(technician.verifiedAt).toLocaleDateString(dateLocale) : '—'}
            </div>
          </div>
        )}
      </div>

      {technician.status === 'rejected' && technician.rejectionReason && (
        <div className="note" style={{ marginBottom: 16, background: 'var(--red-bg)', color: 'var(--red)' }}>
          <b>{t('technicians.rejectionReasonLabel')}:</b> {technician.rejectionReason}
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>{t('technicians.licenseFile')}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <DocLink
          url={fileUrl(technician.freelanceLicenseFileUrl)}
          label={t('technicians.licenseFile')}
          notAttached={t('technicians.notAttached')}
        />
      </div>

      {technician.status === 'pending' && (
        <div className="detail-actions">
          <button className="btn-lg primary" onClick={handleApprove} disabled={busy}>
            {t('technicians.approveRequest')}
          </button>
          <button className="btn-lg outline-red" onClick={() => setShowReject((v) => !v)} disabled={busy}>
            {t('common.reject')}
          </button>
        </div>
      )}

      {showReject && (
        <div className="reject-panel">
          <label htmlFor={`tech-reason-${technician.id}`}>{t('technicians.rejectionReasonLabel')}</label>
          <textarea
            id={`tech-reason-${technician.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('technicians.rejectionPlaceholder')}
          />
          <div className="actions-row">
            <button className="danger" onClick={handleConfirmReject} disabled={busy || !reason.trim()}>
              {t('technicians.confirmReject')}
            </button>
            <button className="secondary" onClick={() => setShowReject(false)} disabled={busy}>
              {t('technicians.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

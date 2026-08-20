'use client';

import { useState } from 'react';
import { fileUrl } from '@/lib/api';
import { PLAN_LABEL, StoreRequest } from '@/lib/types';

const BADGE_CLASS: Record<string, string> = {
  pending: 'b-pending',
  active: 'b-active',
  rejected: 'b-rejected',
  suspended: 'b-suspended',
};
const BADGE_LABEL: Record<string, string> = {
  pending: 'قيد المراجعة',
  active: 'نشط',
  rejected: 'مرفوض',
  suspended: 'موقوف',
};

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="docmissing">{label}: غير مرفق</span>;
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
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const logo = fileUrl(store.logoUrl);
  const sub = store.subscriptions?.[0];

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
    if (!confirm(`إيقاف "${store.name}"؟ سيختفي زر الشات/الحجز/الشراء عند المستهلكين.`)) return;
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
              {store.providerType === 'individual' ? '🔧 فني مستقل' : '🏪 محل'}
            </span>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {store.owner.name} · {store.owner.email}
            </div>
          </div>
        </div>
        <span className={`badge ${BADGE_CLASS[store.status]}`}>{BADGE_LABEL[store.status]}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <DocLink
          url={fileUrl(store.crFileUrl)}
          label={store.providerType === 'individual' ? 'الهوية / رخصة العمل الحر' : 'السجل التجاري'}
        />
        <DocLink url={fileUrl(store.bankCertificateFileUrl)} label="تصديق الحساب البنكي" />
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {store.providerType === 'individual'
          ? `رقم الهوية: ${store.nationalId ?? '—'}`
          : `سجل تجاري: ${store.commercialRegisterNo ?? '—'}`}{' '}
        · آيبان: {store.iban}
        {sub && (
          <>
            {' '}
            · الباقة: {PLAN_LABEL[sub.plan]} ({Number(sub.price).toLocaleString('ar-SA')} ﷼
            {sub.vatAmount ? ` شامل ضريبة ${sub.vatAmount} ﷼` : ''})
          </>
        )}
      </div>

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className={`badge ${sub.paidAt ? 'b-active' : 'b-pending'}`}>
            {sub.paidAt ? `فاتورة مدفوعة (${new Date(sub.paidAt).toLocaleDateString('ar-SA')})` : 'فاتورة غير مدفوعة'}
          </span>
          <button className="link" onClick={handleTogglePayment} disabled={busy}>
            {sub.paidAt ? 'إلغاء تأكيد الدفع' : 'تأكيد استلام الدفع'}
          </button>
        </div>
      )}

      {store.status === 'rejected' && store.rejectionReason && (
        <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0 12px' }}>
          سبب الرفض: {store.rejectionReason}
        </p>
      )}

      {store.status === 'pending' && (
        <div className="actions-row">
          <button className="primary" onClick={handleApprove} disabled={busy}>
            قبول
          </button>
          <button
            className="danger"
            onClick={() => setShowReject((v) => !v)}
            disabled={busy}
          >
            رفض
          </button>
        </div>
      )}

      {store.status === 'active' && (
        <div className="actions-row">
          <button className="danger" onClick={handleSuspend} disabled={busy}>
            إيقاف المحل
          </button>
        </div>
      )}

      {store.status === 'suspended' && (
        <div className="actions-row">
          <button className="primary" onClick={handleReactivate} disabled={busy}>
            إعادة تفعيل المحل
          </button>
        </div>
      )}

      {showReject && (
        <div className="reject-panel">
          <label htmlFor={`reason-${store.id}`}>سبب الرفض</label>
          <textarea
            id={`reason-${store.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب سبب الرفض ليصل للتاجر بالبريد..."
          />
          <div className="actions-row">
            <button className="danger" onClick={handleConfirmReject} disabled={busy || !reason.trim()}>
              تأكيد الرفض
            </button>
            <button className="secondary" onClick={() => setShowReject(false)} disabled={busy}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

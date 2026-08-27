'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

// فواتير المحل الخاصة بالتاجر — عرض فقط، بدون أي تفصيل عن حالة إرسالها لزاتكا
// (هذا شأن داخلي بين المنصة والزكاة، لا يظهر للتاجر أصلاً — راجع
// TaxInvoicesService.listForMerchant بالباك إند)
interface MerchantTaxInvoice {
  id: string;
  invoiceNo: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  createdAt: string;
  order: { id: string; paidAt: string | null; consumer: { name: string; phone: string | null } };
}

export default function TaxInvoicesTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [invoices, setInvoices] = useState<MerchantTaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<MerchantTaxInvoice[]>('/stores/me/tax-invoices');
        setInvoices(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('taxInvoicesTab.loadError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h3 style={{ margin: '4px 0 4px' }}>
        {t('taxInvoicesTab.heading')} {!loading && `(${invoices.length})`}
      </h3>
      <p className="note" style={{ marginBottom: 14 }}>
        {t('taxInvoicesTab.note')}
      </p>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : invoices.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('taxInvoicesTab.empty')}</p>
        </div>
      ) : (
        invoices.map((inv) => (
          <div className="card" key={inv.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontFamily: 'var(--font-cairo)' }}>{inv.invoiceNo}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {t('taxInvoicesTab.customerLabel')}: {inv.order.consumer.name}
                  {inv.order.consumer.phone ? ` · ${inv.order.consumer.phone}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {t('taxInvoicesTab.dateLabel')}: {new Date(inv.createdAt).toLocaleString(dateLocale)}
                </div>
              </div>
              <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)' }}>
                <div>{t('taxInvoicesTab.subtotalLabel')}: {inv.subtotal} ﷼</div>
                <div>{t('taxInvoicesTab.vatLabel')}: {inv.vatAmount} ﷼</div>
                <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                  {t('taxInvoicesTab.totalLabel')}: {inv.total} ﷼
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

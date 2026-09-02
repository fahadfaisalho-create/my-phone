'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
type DeliveryType = 'pickup' | 'delivery';
type CourierProvider = 'aramex' | 'fedex';
type DeliveryMethod = 'courier' | 'store_agent';

interface Order {
  id: string;
  total: string;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  deliveryType: DeliveryType;
  deliveryAddress: string | null;
  deliveryLat: string | null;
  deliveryLng: string | null;
  courierProvider: CourierProvider | null;
  deliveryMethod: DeliveryMethod | null;
  consumer: { name: string; phone: string | null };
  items: { qty: number; product: { name: string } }[];
  branch: { id: string; name: string } | null;
  coupon: { code: string } | null;
}

interface Invoice {
  invoiceNo: string;
  issuedAt: string;
  createdAt: string;
  store: { name: string; taxNo: string | null; commercialRegisterNo: string };
  consumer: { name: string; phone: string | null };
  items: { name: string; qty: number; price: number; lineTotal: number }[];
  subtotal: number;
  deliveryType: DeliveryType;
  deliveryFee: number | null;
  courierProvider: CourierProvider | null;
  deliveryAddress: string | null;
  discountAmount: number | null;
  total: number;
  vatRate: number | null;
  taxableAmount: number | null;
  vatAmount: number | null;
}

function formatDate(iso: string, dateLocale: string) {
  return new Date(iso).toLocaleString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const DELIVERY_LABEL: Record<DeliveryType, string> = {
    pickup: t('ordersTab.deliveryPickup'),
    delivery: t('ordersTab.deliveryDelivery'),
  };
  const COURIER_LABEL: Record<CourierProvider, string> = {
    aramex: t('ordersTab.courierAramex'),
    fedex: t('ordersTab.courierFedex'),
  };
  const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
    courier: t('ordersTab.methodCourier'),
    store_agent: t('ordersTab.methodAgent'),
  };
  const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: t('ordersTab.statusPending'),
    processing: t('ordersTab.statusProcessing'),
    completed: t('ordersTab.statusCompleted'),
    cancelled: t('ordersTab.statusCancelled'),
  };
  const STATUS_BADGE: Record<OrderStatus, string> = {
    pending: 'b-pending',
    processing: 'b-pending',
    completed: 'b-active',
    cancelled: 'b-rejected',
  };
  const PAY_LABEL: Record<Order['paymentStatus'], string> = {
    unpaid: t('ordersTab.payUnpaid'),
    paid: t('ordersTab.payPaid'),
    refunded: t('ordersTab.payRefunded'),
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>('/stores/me/orders');
      setOrders(data);
      setSelectedId((prev) => (prev && data.some((o) => o.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ordersTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  function selectOrder(id: string) {
    setSelectedId(id);
    setShowInvoice(false);
    setInvoice(null);
    setInvoiceError('');
  }

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await apiFetch(`/stores/me/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ordersTab.updateError'));
    } finally {
      setBusyId(null);
    }
  }

  // تحميل الفاتورة كملف PDF فعلي (بدل الاعتماد فقط على "طباعة" المتصفح) — يلتقط
  // نفس محتوى #invoice-print كصورة عالية الدقة ويحوّلها لصفحة PDF بحجم A4
  async function handleDownloadPdf() {
    const el = document.getElementById('invoice-print');
    if (!el) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const hiddenEls = Array.from(el.querySelectorAll<HTMLElement>('.no-print'));
      hiddenEls.forEach((e) => (e.style.display = 'none'));
      let canvas;
      try {
        canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      } finally {
        hiddenEls.forEach((e) => (e.style.display = ''));
      }
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 24;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`${invoice?.invoiceNo || 'invoice'}.pdf`);
    } catch (err) {
      setInvoiceError(t('ordersTab.pdfError'));
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function openInvoice(id: string) {
    setShowInvoice(true);
    setInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(true);
    try {
      const data = await apiFetch<Invoice>(`/stores/me/orders/${id}/invoice`);
      setInvoice(data);
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : t('ordersTab.invoiceLoadError'));
    } finally {
      setInvoiceLoading(false);
    }
  }

  return (
    <div>
      <h3 style={{ margin: '4px 0 14px' }}>
        {t('ordersTab.heading')} {!loading && `(${orders.length})`}
      </h3>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('ordersTab.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{orders.length}</span>
            </div>
            <div className="split-list-body">
              {orders.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('ordersTab.empty')}</p>
              )}
              {orders.map((o) => (
                <div
                  key={o.id}
                  className={`split-list-item ${o.id === selectedId ? 'on' : ''}`}
                  onClick={() => selectOrder(o.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{o.consumer.name}</b>
                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {o.items.map((i) => `${i.product.name} ×${i.qty}`).join('، ')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {o.total} ﷼ · {PAY_LABEL[o.paymentStatus]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{selected.consumer.name}</b>
                  {selected.consumer.phone && (
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{selected.consumer.phone}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className="badge" style={{ background: selected.deliveryType === 'delivery' ? '#FCEBEB' : '#F0F0F0' }}>
                    {DELIVERY_LABEL[selected.deliveryType]}
                  </span>
                  {selected.deliveryType === 'delivery' && selected.deliveryMethod && (
                    <span className="badge" style={{ background: '#F0F0F0' }}>{DELIVERY_METHOD_LABEL[selected.deliveryMethod]}</span>
                  )}
                  {selected.deliveryType === 'delivery' && selected.courierProvider && (
                    <span className="badge" style={{ background: '#F0F0F0' }}>{COURIER_LABEL[selected.courierProvider]}</span>
                  )}
                  <span className={`badge ${STATUS_BADGE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                {selected.items.map((i, idx) => (
                  <div key={idx} className="rowline" style={{ borderBottom: idx === selected.items.length - 1 ? 'none' : undefined }}>
                    <span>{i.product.name}</span>
                    <span style={{ color: 'var(--muted)' }}>× {i.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                {t('ordersTab.viewInvoice')}: <b style={{ fontFamily: 'var(--font-cairo)' }}>{selected.total} ﷼</b>
                {selected.branch && <> · {selected.branch.name}</>}
                {selected.coupon && <> · {selected.coupon.code}</>}
              </div>

              {selected.deliveryType === 'delivery' && selected.deliveryAddress && (
                <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 6 }}>{selected.deliveryAddress}</div>
              )}
              {selected.deliveryType === 'delivery' && selected.deliveryLat && selected.deliveryLng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selected.deliveryLat},${selected.deliveryLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 4, display: 'inline-block' }}
                >
                  {t('ordersTab.openMap')}
                </a>
              )}

              <div className="detail-actions">
                {selected.status === 'pending' && selected.paymentStatus === 'paid' && (
                  <button className="btn-lg primary" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'processing')}>
                    {t('ordersTab.startProcessing')}
                  </button>
                )}
                {selected.status === 'processing' && (
                  <button className="btn-lg primary" disabled={busyId === selected.id} onClick={() => updateStatus(selected.id, 'completed')}>
                    {t('ordersTab.finish')}
                  </button>
                )}
                {selected.paymentStatus === 'paid' && (
                  <button className="btn-lg outline-red" onClick={() => openInvoice(selected.id)}>
                    {t('ordersTab.viewInvoice')}
                  </button>
                )}
              </div>

              {showInvoice && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px dashed var(--border)' }}>
                  {invoiceLoading ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('ordersTab.invoiceLoading')}</p>
                  ) : invoiceError ? (
                    <div className="err">{invoiceError}</div>
                  ) : invoice ? (
                    <div id="invoice-print">
                      <div className="invoice-head">
                        <h3 style={{ marginBottom: 2 }}>{invoice.store.name}</h3>
                        <p className="note" style={{ marginBottom: 0 }}>
                          {invoice.vatRate ? 'فاتورة ضريبية مبسطة' : 'فاتورة مبسطة'}
                        </p>
                        <p className="note" style={{ fontSize: 11 }}>
                          {invoice.vatRate ? 'Simplified Tax Invoice' : 'Simplified Invoice'}
                        </p>
                      </div>

                      <p className="note" style={{ margin: '10px 0 4px', fontWeight: 600 }}>
                        تفاصيل الفاتورة
                      </p>
                      <div className="invoice-meta">
                        <div>رقم الفاتورة: {invoice.invoiceNo}</div>
                        <div>تاريخ الإصدار: {formatDate(invoice.issuedAt, dateLocale)}</div>
                        {invoice.store.taxNo && <div>الرقم الضريبي للمتجر: {invoice.store.taxNo}</div>}
                        <div>السجل التجاري للمتجر: {invoice.store.commercialRegisterNo}</div>
                      </div>

                      <p className="note" style={{ margin: '10px 0 4px', fontWeight: 600 }}>
                        بيانات العميل
                      </p>
                      <div className="invoice-meta">
                        <div>اسم العميل: {invoice.consumer.name}</div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        {invoice.items.map((it, idx) => (
                          <div className="invoice-item" key={idx}>
                            <span>
                              {it.name} × {it.qty}
                            </span>
                            <b>{it.lineTotal} ﷼</b>
                          </div>
                        ))}
                      </div>

                      <div className="invoice-sum">
                        <span>المنتجات</span>
                        <span>{invoice.subtotal} ﷼</span>
                      </div>
                      {invoice.deliveryType === 'delivery' && (
                        <>
                          <div className="invoice-sum">
                            <span>
                              رسوم التوصيل{invoice.courierProvider ? ` (${COURIER_LABEL[invoice.courierProvider]})` : ''}
                            </span>
                            <span>{invoice.deliveryFee ?? 0} ﷼</span>
                          </div>
                          {invoice.deliveryAddress && (
                            <p className="note" style={{ marginTop: 6 }}>
                              {invoice.deliveryAddress}
                            </p>
                          )}
                        </>
                      )}

                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                        <div className="invoice-sum">
                          <span>الإجمالي (قبل الخصم)</span>
                          <span>{(invoice.subtotal + (invoice.deliveryFee ?? 0)).toFixed(2)} ﷼</span>
                        </div>
                        {invoice.discountAmount && (
                          <div className="invoice-sum">
                            <span>إجمالي الخصم</span>
                            <span>{invoice.discountAmount.toFixed(2)} ﷼</span>
                          </div>
                        )}
                        {invoice.vatRate !== null && (
                          <>
                            <div className="invoice-sum">
                              <span>المبلغ الخاضع للضريبة</span>
                              <span>{invoice.taxableAmount?.toFixed(2)} ﷼</span>
                            </div>
                            <div className="invoice-sum">
                              <span>ضريبة القيمة المضافة ({invoice.vatRate}%)</span>
                              <span>{invoice.vatAmount?.toFixed(2)} ﷼</span>
                            </div>
                          </>
                        )}
                        <div className="invoice-total">
                          <span>المبلغ الإجمالي</span>
                          <span>{invoice.total} ﷼</span>
                        </div>
                      </div>

                      <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button className="secondary" style={{ flex: 1 }} onClick={() => window.print()}>
                          طباعة
                        </button>
                        <button className="primary" style={{ flex: 1 }} onClick={handleDownloadPdf} disabled={downloadingPdf}>
                          {downloadingPdf ? t('ordersTab.pdfDownloading') : t('ordersTab.downloadPdf')}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="split-empty">{t('ordersTab.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

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

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  pickup: '🏬 استلام من الفرع',
  delivery: '🚚 توصيل',
};

const COURIER_LABEL: Record<CourierProvider, string> = {
  aramex: '📦 أرامكس',
  fedex: '📦 فيدكس',
};

const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  courier: '📦 شركة شحن',
  store_agent: '🛵 مندوب المحل',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'بانتظار المعالجة',
  processing: 'جارٍ التجهيز',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'b-pending',
  processing: 'b-pending',
  completed: 'b-active',
  cancelled: 'b-rejected',
};
const PAY_LABEL: Record<Order['paymentStatus'], string> = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  refunded: 'مسترجع',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>('/stores/me/orders');
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      await apiFetch(`/stores/me/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الطلب');
    } finally {
      setBusyId(null);
    }
  }

  async function openInvoice(id: string) {
    setInvoiceOrderId(id);
    setInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(true);
    try {
      const data = await apiFetch<Invoice>(`/stores/me/orders/${id}/invoice`);
      setInvoice(data);
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : 'تعذّر تحميل الفاتورة');
    } finally {
      setInvoiceLoading(false);
    }
  }

  function closeInvoice() {
    setInvoiceOrderId(null);
    setInvoice(null);
    setInvoiceError('');
  }

  return (
    <div className="card">
      <h3>الطلبات</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد طلبات بعد</p>
      ) : (
        orders.map((o) => (
          <div className="rowline" key={o.id} style={{ alignItems: 'flex-start' }}>
            <div>
              <b style={{ fontSize: 13 }}>{o.consumer.name}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {o.items.map((i) => `${i.product.name} ×${i.qty}`).join('، ')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {o.total} ﷼ · {PAY_LABEL[o.paymentStatus]}
                {o.branch && <> · 🏬 {o.branch.name}</>}
                {o.coupon && <> · 🏷️ {o.coupon.code}</>}
              </div>
              {o.deliveryType === 'delivery' && o.deliveryAddress && (
                <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4 }}>📍 {o.deliveryAddress}</div>
              )}
              {o.deliveryType === 'delivery' && o.deliveryLat && o.deliveryLng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${o.deliveryLat},${o.deliveryLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2, display: 'inline-block' }}
                >
                  🗺️ فتح الموقع بالخرائط (دقة GPS)
                </a>
              )}
              {o.paymentStatus === 'paid' && (
                <div>
                  <button
                    className="secondary"
                    style={{ marginTop: 6, fontSize: 12 }}
                    onClick={() => openInvoice(o.id)}
                  >
                    🧾 عرض الفاتورة
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="badge" style={{ background: o.deliveryType === 'delivery' ? '#FCEBEB' : '#F0F0F0' }}>
                {DELIVERY_LABEL[o.deliveryType]}
              </span>
              {o.deliveryType === 'delivery' && o.deliveryMethod && (
                <span className="badge" style={{ background: '#F0F0F0' }}>
                  {DELIVERY_METHOD_LABEL[o.deliveryMethod]}
                </span>
              )}
              {o.deliveryType === 'delivery' && o.courierProvider && (
                <span className="badge" style={{ background: '#F0F0F0' }}>
                  {COURIER_LABEL[o.courierProvider]}
                </span>
              )}
              <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              {o.status === 'pending' && o.paymentStatus === 'paid' && (
                <button className="secondary" disabled={busyId === o.id} onClick={() => updateStatus(o.id, 'processing')}>
                  بدء التجهيز
                </button>
              )}
              {o.status === 'processing' && (
                <button className="secondary" disabled={busyId === o.id} onClick={() => updateStatus(o.id, 'completed')}>
                  إنهاء
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {invoiceOrderId && (
        <div className="modal-overlay" onClick={closeInvoice}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close no-print" onClick={closeInvoice} aria-label="إغلاق">
              ✕
            </button>
            {invoiceLoading ? (
              <p style={{ color: 'var(--muted)', fontSize: 13, clear: 'both' }}>جارٍ تحميل الفاتورة...</p>
            ) : invoiceError ? (
              <div className="err" style={{ clear: 'both' }}>
                {invoiceError}
              </div>
            ) : invoice ? (
              <div id="invoice-print" style={{ clear: 'both' }}>
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
                  <div>تاريخ الإصدار: {formatDate(invoice.issuedAt)}</div>
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
                        📍 {invoice.deliveryAddress}
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

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      border: '1.5px dashed var(--border)',
                      borderRadius: 8,
                      background: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      color: 'var(--border)',
                    }}
                  >
                    ▦
                  </div>
                  <p className="note" style={{ textAlign: 'center', maxWidth: 260, marginTop: 8 }}>
                    سيُفعَّل رمز الفاتورة الإلكترونية عند الربط مع منظومة الفوترة الإلكترونية (زاتكا)
                  </p>
                </div>

                <button
                  className="primary no-print"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => window.print()}
                >
                  🖨️ طباعة / حفظ PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

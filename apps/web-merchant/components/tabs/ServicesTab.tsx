'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { DEVICE_LABEL, DeviceSupport, Product, SERVICE_CATALOG, Service } from '@/lib/types';

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyName, setBusyName] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [svc, prod] = await Promise.all([
        apiFetch<Service[]>('/stores/me/services'),
        apiFetch<Product[]>('/stores/me/products'),
      ]);
      setServices(svc);
      setProducts(prod);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleService(name: string) {
    setBusyName(name);
    setError('');
    try {
      const existing = services.find((s) => s.name === name);
      if (existing) {
        await apiFetch(`/stores/me/services/${existing.id}`, { method: 'DELETE' });
      } else {
        await apiFetch('/stores/me/services', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الخدمة');
    } finally {
      setBusyName(null);
    }
  }

  async function updateService(
    id: string,
    patch: Partial<{
      deviceSupport: DeviceSupport;
      laborPrice: number;
      linkedProductId: string;
      supportsInStore: boolean;
      supportsHomeVisit: boolean;
      homeVisitFee: number | null;
    }>,
  ) {
    try {
      await apiFetch(`/stores/me/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ التعديل');
    }
  }

  return (
    <div className="card">
      <h3>اختر خدماتك</h3>
      <div>
        {SERVICE_CATALOG.map((name) => {
          const on = services.some((s) => s.name === name);
          return (
            <span
              key={name}
              className={`chip ${on ? 'on' : ''}`}
              onClick={() => (busyName ? undefined : toggleService(name))}
              style={{ opacity: busyName === name ? 0.6 : 1 }}
            >
              {name}
            </span>
          );
        })}
      </div>
      {error && <div className="err" style={{ marginTop: 10 }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : (
          services.map((sv) => (
            <div className="card" key={sv.id} style={{ background: '#fafaf8' }}>
              <h3 style={{ marginBottom: 8 }}>{sv.name}</h3>
              <label>الأجهزة المدعومة</label>
              <select
                value={sv.deviceSupport}
                onChange={(e) => updateService(sv.id, { deviceSupport: e.target.value as DeviceSupport })}
              >
                {(Object.keys(DEVICE_LABEL) as DeviceSupport[]).map((d) => (
                  <option key={d} value={d}>
                    {DEVICE_LABEL[d]}
                  </option>
                ))}
              </select>
              <label>سعر شغل اليد فقط (﷼)</label>
              <input
                type="number"
                defaultValue={sv.laborPrice}
                onBlur={(e) => updateService(sv.id, { laborPrice: Number(e.target.value) || 0 })}
              />
              <label>قطعة الغيار (اختياري)</label>
              <select
                value={sv.linkedProductId || ''}
                onChange={(e) => updateService(sv.id, { linkedProductId: e.target.value })}
              >
                <option value="">بدون قطعة — شغل يد فقط</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price} ﷼
                  </option>
                ))}
              </select>

              <label>نوع الحجز المدعوم</label>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={sv.supportsInStore}
                    onChange={(e) => updateService(sv.id, { supportsInStore: e.target.checked })}
                  />
                  🏬 بالمحل
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={sv.supportsHomeVisit}
                    onChange={(e) => updateService(sv.id, { supportsHomeVisit: e.target.checked })}
                  />
                  🚗 زيارة منزلية
                </label>
              </div>
              {sv.supportsHomeVisit && (
                <>
                  <label>رسوم إضافية للزيارة المنزلية (اختياري، ﷼)</label>
                  <input
                    type="number"
                    defaultValue={sv.homeVisitFee || ''}
                    placeholder="بدون رسوم إضافية"
                    onBlur={(e) =>
                      updateService(sv.id, {
                        homeVisitFee: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

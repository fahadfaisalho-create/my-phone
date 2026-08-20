'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { DEVICE_LABEL, DEVICE_LABEL_EN, DeviceSupport, Product, SERVICE_CATALOG, Service } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function ServicesTab() {
  const { t, locale } = useLocale();
  const deviceLabel = locale === 'ar' ? DEVICE_LABEL : DEVICE_LABEL_EN;
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
      setError(err instanceof ApiError ? err.message : t('services.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err instanceof ApiError ? err.message : t('services.updateError'));
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
      setError(err instanceof ApiError ? err.message : t('services.saveError'));
    }
  }

  return (
    <div className="card">
      <h3>{t('services.chooseHeading')}</h3>
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
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : (
          services.map((sv) => (
            <div className="card" key={sv.id} style={{ background: '#fafaf8' }}>
              <h3 style={{ marginBottom: 8 }}>{sv.name}</h3>
              <label>{t('services.deviceSupport')}</label>
              <select
                value={sv.deviceSupport}
                onChange={(e) => updateService(sv.id, { deviceSupport: e.target.value as DeviceSupport })}
              >
                {(Object.keys(DEVICE_LABEL) as DeviceSupport[]).map((d) => (
                  <option key={d} value={d}>
                    {deviceLabel[d]}
                  </option>
                ))}
              </select>
              <label>{t('services.laborPrice')}</label>
              <input
                type="number"
                defaultValue={sv.laborPrice}
                onBlur={(e) => updateService(sv.id, { laborPrice: Number(e.target.value) || 0 })}
              />
              <label>{t('services.linkedProduct')}</label>
              <select
                value={sv.linkedProductId || ''}
                onChange={(e) => updateService(sv.id, { linkedProductId: e.target.value })}
              >
                <option value="">{t('services.noProduct')}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price} ﷼
                  </option>
                ))}
              </select>

              <label>{t('services.bookingType')}</label>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={sv.supportsInStore}
                    onChange={(e) => updateService(sv.id, { supportsInStore: e.target.checked })}
                  />
                  {t('services.inStore')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={sv.supportsHomeVisit}
                    onChange={(e) => updateService(sv.id, { supportsHomeVisit: e.target.checked })}
                  />
                  {t('services.homeVisit')}
                </label>
              </div>
              {sv.supportsHomeVisit && (
                <>
                  <label>{t('services.homeVisitFee')}</label>
                  <input
                    type="number"
                    defaultValue={sv.homeVisitFee || ''}
                    placeholder={t('services.homeVisitFeePlaceholder')}
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

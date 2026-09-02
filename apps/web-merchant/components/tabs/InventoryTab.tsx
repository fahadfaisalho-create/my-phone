'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Product } from '@/lib/types';
import { useLocale } from '@/lib/i18n';

export default function InventoryTab() {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>('/stores/me/products');
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('inventory.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function adjust(id: string, delta: number) {
    setBusyId(id);
    setError('');
    try {
      const updated = await apiFetch<Product>(`/stores/me/products/${id}/inventory`, {
        method: 'PATCH',
        body: JSON.stringify({ delta }),
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('inventory.updateError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h3>{t('inventory.heading')}</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('inventory.empty')}</p>
      ) : (
        products.map((p) => (
          <div className="rowline" key={p.id}>
            <span>
              {p.name}
              {p.branch && (
                <span style={{ color: 'var(--muted)', fontSize: 12 }}> · {p.branch.name}</span>
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="qtybtn" onClick={() => adjust(p.id, -1)} disabled={busyId === p.id || p.quantity <= 0}>
                -
              </button>
              <span style={{ minWidth: 20, textAlign: 'center' }}>{p.quantity}</span>
              <button className="qtybtn" onClick={() => adjust(p.id, 1)} disabled={busyId === p.id}>
                +
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

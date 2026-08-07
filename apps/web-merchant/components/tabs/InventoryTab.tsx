'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Product } from '@/lib/types';

export default function InventoryTab() {
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل المخزون');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      setError(err instanceof ApiError ? err.message : 'تعذّر تحديث الكمية');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h3>إدارة كمية المخزون</h3>
      {error && <div className="err">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد منتجات بعد</p>
      ) : (
        products.map((p) => (
          <div className="rowline" key={p.id}>
            <span>{p.name}</span>
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

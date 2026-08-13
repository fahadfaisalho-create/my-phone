'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Branch } from '@/lib/types';
import BranchMapPicker from '@/components/BranchMapPicker';

export default function BranchesTab() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Branch[]>('/stores/me/branches');
      setBranches(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الفروع');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/stores/me/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        }),
      });
      setName('');
      setAddress('');
      setLat(null);
      setLng(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إضافة الفرع');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/branches/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف الفرع');
    }
  }

  return (
    <div className="card">
      <h3>إضافة فرع</h3>
      <div className="row2">
        <input placeholder="اسم الفرع" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="الموقع / الحي (نصي)" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <BranchMapPicker
        lat={lat}
        lng={lng}
        onPick={(la, ln) => {
          setLat(la);
          setLng(ln);
        }}
        onAddressSuggestion={(a) => {
          // اقتراح تلقائي فقط لو التاجر ما كتب عنوان بنفسه بعد
          setAddress((prev) => (prev.trim() ? prev : a));
        }}
      />

      {error && <div className="err">{error}</div>}
      <button className="primary" onClick={handleAdd} disabled={saving || !name.trim()}>
        إضافة الفرع
      </button>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : branches.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد فروع بعد</p>
        ) : (
          branches.map((b) => (
            <div className="rowline" key={b.id}>
              <span>{b.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)' }}>
                  {b.address}
                  {b.lat !== null && b.lng !== null && (
                    <>
                      {' '}
                      ·{' '}
                      <a
                        href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📍 عرض بالخريطة
                      </a>
                    </>
                  )}
                </span>
                <button className="link" onClick={() => handleDelete(b.id)}>
                  حذف
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Branch } from '@/lib/types';
import BranchMapPicker from '@/components/BranchMapPicker';
import { useLocale } from '@/lib/i18n';

export default function BranchesTab() {
  const { t } = useLocale();
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
      setError(err instanceof ApiError ? err.message : t('branches.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err instanceof ApiError ? err.message : t('branches.addError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/branches/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('branches.deleteError'));
    }
  }

  return (
    <div className="card">
      <h3>{t('branches.addHeading')}</h3>
      <div className="row2">
        <input placeholder={t('branches.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder={t('branches.addressPlaceholder')} value={address} onChange={(e) => setAddress(e.target.value)} />
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
        {t('branches.addBranch')}
      </button>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : branches.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('branches.empty')}</p>
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
                        {t('branches.viewOnMap')}
                      </a>
                    </>
                  )}
                </span>
                <button className="link" onClick={() => handleDelete(b.id)}>
                  {t('common.delete')}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

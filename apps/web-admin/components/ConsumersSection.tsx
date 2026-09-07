'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useLocale } from '@/lib/i18n';

interface Consumer {
  id: string;
  name: string;
  phone: string | null;
  suspended: boolean;
  createdAt: string;
  _count: { orders: number; bookings: number };
}

interface ConsumersPage {
  items: Consumer[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ConsumersSection() {
  const { t, tf, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ConsumersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (search.trim()) query.set('search', search.trim());
      const result = await apiFetch<ConsumersPage>(`/admin/consumers?${query.toString()}`);
      setData(result);
      setSelectedId((prev) => (prev && result.items.some((c) => c.id === prev) ? prev : result.items[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('consumers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = data?.items.find((c) => c.id === selectedId) ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleSuspend(id: string, name: string) {
    if (!confirm(tf('consumers.suspendConfirm', name))) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/consumers/${id}/suspend`, { method: 'PATCH' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleReactivate(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/admin/consumers/${id}/reactivate`, { method: 'PATCH' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selected?.phone) return;
    setResetMsg('');
    setResetErr('');
    setResetBusy(true);
    try {
      await apiFetch('/admin/users/reset-password', {
        method: 'PATCH',
        body: JSON.stringify({ identifier: selected.phone, newPassword }),
      });
      setResetMsg(t('consumers.resetPasswordSuccess'));
      setNewPassword('');
    } catch (err) {
      setResetErr(err instanceof ApiError ? err.message : t('consumers.resetPasswordError'));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('consumers.searchPlaceholder')}
          style={{ maxWidth: 320 }}
        />
      </form>

      <h3 style={{ margin: '4px 0 14px' }}>
        {t('consumers.heading')} {data && !loading && `(${data.total})`}
      </h3>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('consumers.heading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{data?.total ?? 0}</span>
            </div>
            <div className="split-list-body">
              {data?.items.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('consumers.empty')}</p>
              )}
              {data?.items.map((c) => (
                <div
                  key={c.id}
                  className={`split-list-item ${c.id === selectedId ? 'on' : ''}`}
                  onClick={() => {
                    setSelectedId(c.id);
                    setResetMsg('');
                    setResetErr('');
                    setNewPassword('');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{c.name}</b>
                    {c.suspended && <span className="badge b-suspended">{t('consumers.suspended')}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {c.phone ?? '—'} · {new Date(c.createdAt).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>
            {data && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="link" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('consumers.prevPage')}
                </button>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{tf('consumers.pageLabel', String(page), String(totalPages))}</span>
                <button type="button" className="link" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('consumers.nextPage')}
                </button>
              </div>
            )}
          </div>

          {selected ? (
            <div className="split-detail">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                      {selected.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{selected.phone ?? '—'}</div>
                  </div>
                  <span className={`badge ${selected.suspended ? 'b-suspended' : 'b-active'}`}>
                    {selected.suspended ? t('consumers.suspended') : t('consumers.active')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('consumers.ordersCount')}</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{selected._count.orders}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('consumers.bookingsCount')}</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{selected._count.bookings}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('consumers.joinedAt')}</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{new Date(selected.createdAt).toLocaleDateString(dateLocale)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
                  {selected.suspended ? (
                    <button className="btn-lg primary" disabled={busy} onClick={() => handleReactivate(selected.id)}>
                      {t('consumers.reactivateAction')}
                    </button>
                  ) : (
                    <button className="btn-lg outline-red" disabled={busy} onClick={() => handleSuspend(selected.id, selected.name)}>
                      {t('consumers.suspendAction')}
                    </button>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  <h3 style={{ marginBottom: 6, fontSize: 14 }}>{t('consumers.resetPasswordHeading')}</h3>
                  <p className="note" style={{ marginBottom: 12 }}>{t('consumers.resetPasswordNote')}</p>
                  <form onSubmit={handleResetPassword} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label htmlFor="newPassword">{t('consumers.newPasswordLabel')}</label>
                      <input
                        id="newPassword"
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <button className="btn-lg primary" type="submit" disabled={resetBusy || newPassword.length < 6}>
                      {t('consumers.resetPasswordSubmit')}
                    </button>
                  </form>
                  {resetMsg && <p className="note" style={{ color: 'var(--green)', marginTop: 10 }}>{resetMsg}</p>}
                  {resetErr && <div className="err" style={{ marginTop: 10 }}>{resetErr}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('consumers.selectPrompt')}</div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, downloadFile } from '@/lib/api';
import { Employee, StoreSection } from '@/lib/types';
import DeliveryZonePicker from '@/components/DeliveryZonePicker';
import { useLocale } from '@/lib/i18n';

// نفس أقسام الشريط الجانبي بلوحة التاجر بالضبط — كل قسم صلاحية مستقلة
const SECTIONS: { key: StoreSection; navKey: string }[] = [
  { key: 'branches', navKey: 'nav.branches' },
  { key: 'technicians', navKey: 'nav.technicians' },
  { key: 'services', navKey: 'nav.services' },
  { key: 'products', navKey: 'nav.products' },
  { key: 'inventory', navKey: 'nav.inventory' },
  { key: 'bookings', navKey: 'nav.bookings' },
  { key: 'orders', navKey: 'nav.orders' },
  { key: 'taxInvoices', navKey: 'nav.taxInvoices' },
  { key: 'coupons', navKey: 'nav.coupons' },
  { key: 'ads', navKey: 'nav.ads' },
  { key: 'messages', navKey: 'nav.messages' },
  { key: 'stats', navKey: 'nav.stats' },
  { key: 'support', navKey: 'nav.support' },
  { key: 'settings', navKey: 'nav.settings' },
];

export default function EmployeesTab() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // نموذج الإنشاء
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<Set<StoreSection>>(new Set());
  const [zoneLat, setZoneLat] = useState<number | null>(null);
  const [zoneLng, setZoneLng] = useState<number | null>(null);
  const [zoneRadiusM, setZoneRadiusM] = useState('500');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [justCreated, setJustCreated] = useState<Employee | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Employee[]>('/stores/me/employees');
      setEmployees(data);
      setSelectedId((prev) => (prev && data.some((e) => e.id === prev) ? prev : data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('employeesTab.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  function togglePermission(key: StoreSection) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetForm() {
    setFirstName('');
    setLastName('');
    setPhone('');
    setNationalId('');
    setBirthDate('');
    setEmail('');
    setPassword('');
    setPermissions(new Set());
    setZoneLat(null);
    setZoneLng(null);
    setZoneRadiusM('500');
  }

  async function handleCreate() {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !nationalId.trim() ||
      !birthDate ||
      !email.trim() ||
      password.length < 6
    )
      return;
    setCreating(true);
    setCreateError('');
    setJustCreated(null);
    try {
      const body: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        birthDate,
        email: email.trim(),
        password,
        permissions: Array.from(permissions),
      };
      if (zoneLat !== null && zoneLng !== null && zoneRadiusM) {
        body.attendanceLat = zoneLat;
        body.attendanceLng = zoneLng;
        body.attendanceRadiusM = Number(zoneRadiusM);
      }
      const created = await apiFetch<Employee>('/stores/me/employees', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setJustCreated(created);
      resetForm();
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : t('employeesTab.createError'));
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(emp: Employee) {
    setBusy(true);
    try {
      await apiFetch(`/stores/me/employees/${emp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !emp.active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('employeesTab.updateError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(t('employeesTab.deleteConfirm'))) return;
    setBusy(true);
    try {
      await apiFetch(`/stores/me/employees/${emp.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('employeesTab.deleteError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    try {
      await downloadFile('/stores/me/employees/export', 'employees.xlsx');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('employeesTab.exportError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>{t('employeesTab.createHeading')}</h3>
        <p className="note" style={{ marginBottom: 12 }}>
          {t('employeesTab.createNote')}
        </p>

        <div className="row2">
          <div>
            <label htmlFor="empFirstName">{t('employeesTab.firstName')}</label>
            <input id="empFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="empLastName">{t('employeesTab.lastName')}</label>
            <input id="empLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="row2">
          <div>
            <label htmlFor="empPhone">{t('employeesTab.phone')}</label>
            <input id="empPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
          </div>
          <div>
            <label htmlFor="empNationalId">{t('employeesTab.nationalId')}</label>
            <input id="empNationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>
        </div>
        <div className="row2">
          <div>
            <label htmlFor="empBirthDate">{t('employeesTab.birthDate')}</label>
            <input id="empBirthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="empEmail">{t('employeesTab.email')}</label>
            <input id="empEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="row2">
          <div>
            <label htmlFor="empPassword">{t('employeesTab.password')}</label>
            <input
              id="empPassword"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div />
        </div>

        <label>{t('employeesTab.permissionsLabel')}</label>
        <p className="note" style={{ marginTop: 0 }}>
          {t('employeesTab.permissionsNote')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {SECTIONS.map((s) => (
            <span
              key={s.key}
              className={`chip ${permissions.has(s.key) ? 'on' : ''}`}
              onClick={() => togglePermission(s.key)}
            >
              {t(s.navKey)}
            </span>
          ))}
        </div>

        <label>{t('employeesTab.attendanceZoneLabel')}</label>
        <p className="note" style={{ marginTop: 0 }}>
          {t('employeesTab.attendanceZoneNote')}
        </p>
        <DeliveryZonePicker
          lat={zoneLat}
          lng={zoneLng}
          radiusKm={zoneRadiusM ? Number(zoneRadiusM) / 1000 : null}
          onPick={(lat, lng) => {
            setZoneLat(lat);
            setZoneLng(lng);
          }}
        />
        <label htmlFor="empRadius">{t('employeesTab.attendanceRadius')}</label>
        <input
          id="empRadius"
          type="number"
          min="10"
          value={zoneRadiusM}
          onChange={(e) => setZoneRadiusM(e.target.value)}
        />

        {createError && <div className="err">{createError}</div>}
        <button
          className="primary"
          onClick={handleCreate}
          disabled={
            creating ||
            !firstName.trim() ||
            !lastName.trim() ||
            !phone.trim() ||
            !nationalId.trim() ||
            !birthDate ||
            !email.trim() ||
            password.length < 6
          }
        >
          {creating ? t('common.saving') : t('employeesTab.createAccount')}
        </button>

        {justCreated && (
          <div className="note" style={{ marginTop: 14, background: 'var(--indigo-bg)' }}>
            <b>{t('employeesTab.createdHeading')}</b>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              {t('employeesTab.emailLabel')}: <b style={{ fontFamily: 'var(--font-cairo)' }}>{justCreated.user.email}</b>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>{t('employeesTab.createdNote')}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 14px' }}>
        <h3 style={{ margin: 0 }}>
          {t('employeesTab.listHeading')} {!loading && `(${employees.length})`}
        </h3>
        <button className="secondary" onClick={handleExport} disabled={employees.length === 0}>
          {t('employeesTab.exportExcel')}
        </button>
      </div>
      {error && <div className="err">{error}</div>}

      {loading ? (
        <div className="spinner-wrap">{t('common.loading')}</div>
      ) : (
        <div className="split-view">
          <div className="split-list">
            <div className="split-list-head">
              <span>{t('employeesTab.listHeading')}</span>
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 12 }}>{employees.length}</span>
            </div>
            <div className="split-list-body">
              {employees.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '16px' }}>{t('employeesTab.empty')}</p>
              )}
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className={`split-list-item ${emp.id === selectedId ? 'on' : ''}`}
                  onClick={() => setSelectedId(emp.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>{emp.firstName} {emp.lastName}</b>
                    <span className={`badge ${emp.active ? 'b-active' : 'b-rejected'}`}>
                      {emp.active ? t('employeesTab.active') : t('employeesTab.suspended')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{emp.user.phone}</div>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="split-detail card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-cairo)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                    {selected.firstName} {selected.lastName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                    {selected.user.phone} {selected.user.email ? `· ${selected.user.email}` : ''}
                  </div>
                </div>
                <span className={`badge ${selected.active ? 'b-active' : 'b-rejected'}`}>
                  {selected.active ? t('employeesTab.active') : t('employeesTab.suspended')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('employeesTab.nationalId')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{selected.nationalId}</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('employeesTab.birthDate')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{new Date(selected.birthDate).toLocaleDateString(dateLocale)}</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('employeesTab.startDate')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{new Date(selected.createdAt).toLocaleDateString(dateLocale)}</div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>{t('employeesTab.attendanceZoneLabel')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                    {selected.attendanceRadiusM ? `${selected.attendanceRadiusM} ${t('employeesTab.meters')}` : t('employeesTab.noZone')}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>
                {t('employeesTab.permissionsLabel')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {SECTIONS.filter((s) => selected.permissions.includes(s.key)).map((s) => (
                  <span key={s.key} className="badge b-active">{t(s.navKey)}</span>
                ))}
                {selected.permissions.length === 0 && (
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t('employeesTab.noPermissions')}</span>
                )}
              </div>

              <div className="detail-actions">
                <button className="btn-lg primary" disabled={busy} onClick={() => handleToggleActive(selected)}>
                  {selected.active ? t('employeesTab.suspendAccount') : t('employeesTab.reactivateAccount')}
                </button>
                <button className="btn-lg outline-red" disabled={busy} onClick={() => handleDelete(selected)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ) : (
            <div className="split-empty">{t('employeesTab.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

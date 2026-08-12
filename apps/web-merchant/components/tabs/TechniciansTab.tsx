'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { Technician } from '@/lib/types';
import FileField from '@/components/FileField';

export default function TechniciansTab() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // نموذج إضافة شهادة — لكل موظف حقل عنوان + ملف مستقل
  const [certTitle, setCertTitle] = useState<Record<string, string>>({});
  const [certFile, setCertFile] = useState<Record<string, File | null>>({});
  const [certSavingId, setCertSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Technician[]>('/stores/me/technicians');
      setTechnicians(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تحميل فريق الصيانة');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!name.trim() || !nationality.trim()) return;
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('nationality', nationality.trim());
      if (experienceYears) form.append('experienceYears', experienceYears);
      if (licenseNo.trim()) form.append('freelanceLicenseNo', licenseNo.trim());
      if (photo) form.append('photo', photo);
      if (licenseFile) form.append('freelanceLicenseFile', licenseFile);

      await apiFetch('/stores/me/technicians', { method: 'POST', body: form });
      setName('');
      setNationality('');
      setExperienceYears('');
      setLicenseNo('');
      setPhoto(null);
      setLicenseFile(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ بيانات الموظف');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/technicians/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف الموظف');
    }
  }

  async function handleAddCertificate(technicianId: string) {
    const title = certTitle[technicianId]?.trim();
    if (!title) return;
    setCertSavingId(technicianId);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      const file = certFile[technicianId];
      if (file) form.append('certificateFile', file);

      await apiFetch(`/stores/me/technicians/${technicianId}/certificates`, { method: 'POST', body: form });
      setCertTitle((s) => ({ ...s, [technicianId]: '' }));
      setCertFile((s) => ({ ...s, [technicianId]: null }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إضافة الشهادة');
    } finally {
      setCertSavingId(null);
    }
  }

  async function handleDeleteCertificate(technicianId: string, certId: string) {
    try {
      await apiFetch(`/stores/me/technicians/${technicianId}/certificates/${certId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف الشهادة');
    }
  }

  return (
    <div>
      <div className="card">
        <h3>إضافة فني صيانة</h3>
        <p className="note" style={{ marginBottom: 10 }}>
          هذي البيانات تظهر للمستهلك بصفحة محلك — تعطي انطباع مصداقية وتسوّق لفريقك.
        </p>
        <div className="row2">
          <input placeholder="اسم الفني" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="الجنسية" value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </div>
        <div className="row2">
          <input
            placeholder="سنوات الخبرة في الصيانة"
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
          <input
            placeholder="رقم رخصة العمل الحر (اختياري)"
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
          />
        </div>
        <FileField label="صورة الفني (اختياري)" accept="image/*" file={photo} onChange={setPhoto} previewAsImage />
        <FileField
          label="ملف رخصة العمل الحر (اختياري)"
          accept="image/*,application/pdf"
          file={licenseFile}
          onChange={setLicenseFile}
        />
        {error && <div className="err">{error}</div>}
        <button
          className="primary"
          onClick={handleAdd}
          disabled={saving || !name.trim() || !nationality.trim()}
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ ونشر بيانات الفني'}
        </button>
      </div>

      <div className="card">
        <h3>فريق الصيانة</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</p>
        ) : technicians.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>لا يوجد فنيين مضافين بعد</p>
        ) : (
          technicians.map((t) => (
            <div key={t.id} className="card" style={{ background: '#FAFAFA' }}>
              <div className="rowline" style={{ alignItems: 'flex-start' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {t.photoUrl && <img src={fileUrl(t.photoUrl)!} className="thumb" alt={t.name} />}
                  <span>
                    <b>{t.name}</b>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {t.nationality}
                      {t.experienceYears != null ? ` · خبرة ${t.experienceYears} سنة` : ''}
                    </div>
                    {t.freelanceLicenseNo && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        رخصة عمل حر: {t.freelanceLicenseNo}
                        {t.freelanceLicenseFileUrl && (
                          <>
                            {' '}
                            —{' '}
                            <a href={fileUrl(t.freelanceLicenseFileUrl)!} target="_blank" rel="noopener noreferrer">
                              عرض الملف
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </span>
                </span>
                <button className="link" onClick={() => handleDelete(t.id)}>
                  حذف
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12.5 }}>الشهادات</label>
                {t.certificates.length === 0 ? (
                  <p className="note" style={{ margin: '4px 0' }}>
                    لا توجد شهادات مضافة
                  </p>
                ) : (
                  t.certificates.map((c) => (
                    <div key={c.id} className="rowline" style={{ padding: '6px 0' }}>
                      <span style={{ fontSize: 13 }}>
                        🎓 {c.title}
                        {c.fileUrl && (
                          <>
                            {' '}
                            —{' '}
                            <a href={fileUrl(c.fileUrl)!} target="_blank" rel="noopener noreferrer">
                              عرض الملف
                            </a>
                          </>
                        )}
                      </span>
                      <button className="link" onClick={() => handleDeleteCertificate(t.id, c.id)}>
                        حذف
                      </button>
                    </div>
                  ))
                )}

                <div className="row2" style={{ marginTop: 8 }}>
                  <input
                    placeholder="عنوان الشهادة (مثال: صيانة أجهزة أبل المعتمدة)"
                    value={certTitle[t.id] || ''}
                    onChange={(e) => setCertTitle((s) => ({ ...s, [t.id]: e.target.value }))}
                  />
                  <FileField
                    label="ملف الشهادة (اختياري)"
                    accept="image/*,application/pdf"
                    file={certFile[t.id] || null}
                    onChange={(f) => setCertFile((s) => ({ ...s, [t.id]: f }))}
                  />
                </div>
                <button
                  className="secondary"
                  style={{ marginTop: 8 }}
                  disabled={certSavingId === t.id || !certTitle[t.id]?.trim()}
                  onClick={() => handleAddCertificate(t.id)}
                >
                  {certSavingId === t.id ? 'جارٍ الإضافة...' : '+ إضافة شهادة'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

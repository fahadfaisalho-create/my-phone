'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, fileUrl } from '@/lib/api';
import { Technician } from '@/lib/types';
import FileField from '@/components/FileField';
import { useLocale } from '@/lib/i18n';

export default function TechniciansTab() {
  const { t, tf } = useLocale();
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
      setError(err instanceof ApiError ? err.message : t('technicians.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err instanceof ApiError ? err.message : t('technicians.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/stores/me/technicians/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('technicians.deleteError'));
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
      setError(err instanceof ApiError ? err.message : t('technicians.addCertError'));
    } finally {
      setCertSavingId(null);
    }
  }

  async function handleDeleteCertificate(technicianId: string, certId: string) {
    try {
      await apiFetch(`/stores/me/technicians/${technicianId}/certificates/${certId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('technicians.deleteCertError'));
    }
  }

  return (
    <div>
      <div className="card">
        <h3>{t('technicians.addHeading')}</h3>
        <p className="note" style={{ marginBottom: 10 }}>
          {t('technicians.addNote')}
        </p>
        <div className="row2">
          <input placeholder={t('technicians.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder={t('technicians.nationalityPlaceholder')} value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </div>
        <div className="row2">
          <input
            placeholder={t('technicians.experiencePlaceholder')}
            type="number"
            min="0"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
          <input
            placeholder={t('technicians.licenseNoPlaceholder')}
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
          />
        </div>
        <FileField label={t('technicians.photoLabel')} accept="image/*" file={photo} onChange={setPhoto} previewAsImage />
        <FileField
          label={t('technicians.licenseFileLabel')}
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
          {saving ? t('common.saving') : t('technicians.saveAndPublish')}
        </button>
      </div>

      <div className="card">
        <h3>{t('technicians.teamHeading')}</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.loading')}</p>
        ) : technicians.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('technicians.empty')}</p>
        ) : (
          technicians.map((tech) => (
            <div key={tech.id} className="card" style={{ background: '#FAFAFA' }}>
              <div className="rowline" style={{ alignItems: 'flex-start' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {tech.photoUrl && <img src={fileUrl(tech.photoUrl)!} className="thumb" alt={tech.name} />}
                  <span>
                    <b>{tech.name}</b>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {tech.nationality}
                      {tech.experienceYears != null ? tf('technicians.experienceYears', String(tech.experienceYears)) : ''}
                    </div>
                    {tech.freelanceLicenseNo && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {t('technicians.freelanceLicense')}: {tech.freelanceLicenseNo}
                        {tech.freelanceLicenseFileUrl && (
                          <>
                            {' '}
                            —{' '}
                            <a href={fileUrl(tech.freelanceLicenseFileUrl)!} target="_blank" rel="noopener noreferrer">
                              {t('technicians.viewFile')}
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </span>
                </span>
                <button className="link" onClick={() => handleDelete(tech.id)}>
                  {t('common.delete')}
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12.5 }}>{t('technicians.certificates')}</label>
                {tech.certificates.length === 0 ? (
                  <p className="note" style={{ margin: '4px 0' }}>
                    {t('technicians.noCertificates')}
                  </p>
                ) : (
                  tech.certificates.map((c) => (
                    <div key={c.id} className="rowline" style={{ padding: '6px 0' }}>
                      <span style={{ fontSize: 13 }}>
                        🎓 {c.title}
                        {c.fileUrl && (
                          <>
                            {' '}
                            —{' '}
                            <a href={fileUrl(c.fileUrl)!} target="_blank" rel="noopener noreferrer">
                              {t('technicians.viewFile')}
                            </a>
                          </>
                        )}
                      </span>
                      <button className="link" onClick={() => handleDeleteCertificate(tech.id, c.id)}>
                        {t('common.delete')}
                      </button>
                    </div>
                  ))
                )}

                <div className="row2" style={{ marginTop: 8 }}>
                  <input
                    placeholder={t('technicians.certTitlePlaceholder')}
                    value={certTitle[tech.id] || ''}
                    onChange={(e) => setCertTitle((s) => ({ ...s, [tech.id]: e.target.value }))}
                  />
                  <FileField
                    label={t('technicians.certFileLabel')}
                    accept="image/*,application/pdf"
                    file={certFile[tech.id] || null}
                    onChange={(f) => setCertFile((s) => ({ ...s, [tech.id]: f }))}
                  />
                </div>
                <button
                  className="secondary"
                  style={{ marginTop: 8 }}
                  disabled={certSavingId === tech.id || !certTitle[tech.id]?.trim()}
                  onClick={() => handleAddCertificate(tech.id)}
                >
                  {certSavingId === tech.id ? t('technicians.addingCert') : t('technicians.addCert')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

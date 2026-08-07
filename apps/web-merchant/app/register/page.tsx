'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { SubscriptionPlan, PLAN_LABEL, PLAN_PRICE } from '@/lib/types';
import FileField from '@/components/FileField';

interface RegisterResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string };
}

const PLANS: SubscriptionPlan[] = ['monthly', 'six_months', 'yearly'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // خطوة 1
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // خطوة 2
  const [storeName, setStoreName] = useState('');
  const [cr, setCr] = useState('');
  const [tax, setTax] = useState('');
  const [iban, setIban] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [crFile, setCrFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);

  // خطوة 3
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  function goStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (!repName.trim() || !email.trim() || !password) {
      setError('عبّي كل الحقول');
      return;
    }
    setError('');
    setStep(2);
  }

  function goStep2Next(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName.trim() || !cr.trim() || !iban.trim()) {
      setError('عبّي الحقول الأساسية (اسم المحل، السجل التجاري، الآيبان)');
      return;
    }
    if (!crFile) {
      setError('ارفع ملف السجل التجاري');
      return;
    }
    if (!bankFile) {
      setError('ارفع ملف تصديق الحساب البنكي');
      return;
    }
    setError('');
    setStep(3);
  }

  async function handleSubmit() {
    if (!plan) {
      setError('اختر خطة اشتراك');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('repName', repName);
      form.append('email', email);
      form.append('password', password);
      if (phone) form.append('phone', phone);
      form.append('storeName', storeName);
      form.append('commercialRegisterNo', cr);
      if (tax) form.append('taxNo', tax);
      form.append('iban', iban);
      form.append('plan', plan);
      if (logo) form.append('logo', logo);
      if (crFile) form.append('crFile', crFile);
      if (bankFile) form.append('bankFile', bankFile);

      const res = await apiFetch<RegisterResponse>('/auth/register-merchant', {
        method: 'POST',
        body: form,
      });
      setSession(res.accessToken, res.user);
      router.replace('/pending');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إرسال الطلب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="card card-narrow" style={{ marginTop: 40 }}>
        <div className="step-indicator">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`step-dot ${step === n ? 'on' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={goStep1Next}>
            <h2>بيانات ممثل الشركة</h2>
            <label htmlFor="repName">الاسم الكامل</label>
            <input id="repName" value={repName} onChange={(e) => setRepName(e.target.value)} autoFocus />
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="password">كلمة السر</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="phone">رقم الجوال (اختياري)</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {error && <div className="err">{error}</div>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              التالي
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={goStep2Next}>
            <h2>البيانات الأساسية للمحل</h2>
            <label htmlFor="storeName">اسم المحل</label>
            <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoFocus />
            <label htmlFor="cr">رقم السجل التجاري</label>
            <input id="cr" value={cr} onChange={(e) => setCr(e.target.value)} />
            <label htmlFor="tax">الرقم الضريبي (اختياري)</label>
            <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
            <label htmlFor="iban">رقم الآيبان</label>
            <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

            <FileField label="شعار المحل" accept="image/*" file={logo} onChange={setLogo} previewAsImage />
            <FileField
              label="ملف السجل التجاري"
              required
              accept="image/*,.pdf"
              file={crFile}
              onChange={setCrFile}
            />
            <FileField
              label="ملف تصديق الحساب البنكي"
              required
              accept="image/*,.pdf"
              file={bankFile}
              onChange={setBankFile}
            />
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '-6px 0 14px' }}>
              صيغ مقبولة: صور أو PDF (حتى 5 ميغابايت)
            </p>

            {error && <div className="err">{error}</div>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              التالي
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(1)}>
                رجوع
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div>
            <h2>اختر خطة الاشتراك</h2>
            <div className="row2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {PLANS.map((p) => (
                <div
                  key={p}
                  className={`chip ${plan === p ? 'on' : ''}`}
                  style={{ textAlign: 'center', padding: 14, cursor: 'pointer', display: 'block' }}
                  onClick={() => setPlan(p)}
                >
                  {PLAN_LABEL[p]}
                  <br />
                  <b>{PLAN_PRICE[p]}</b>
                </div>
              ))}
            </div>
            <div style={{ height: 14 }} />
            {error && <div className="err">{error}</div>}
            <button className="primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'جارٍ الإرسال...' : 'إرسال طلب الاشتراك'}
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(2)}>
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

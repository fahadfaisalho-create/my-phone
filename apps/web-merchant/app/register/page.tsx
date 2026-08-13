'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { SubscriptionPlan, StoreProviderType, PLAN_LABEL, PLAN_PRICE } from '@/lib/types';
import FileField from '@/components/FileField';

interface RegisterResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string };
}

const PLANS: SubscriptionPlan[] = ['monthly', 'six_months', 'yearly'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // خطوة 0
  const [accountType, setAccountType] = useState<StoreProviderType | null>(null);

  // خطوة 1
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // خطوة 2 (محل)
  const [storeName, setStoreName] = useState('');
  const [cr, setCr] = useState('');
  const [tax, setTax] = useState('');
  const [iban, setIban] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [crFile, setCrFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);

  // خطوة 2 إضافية (فني مستقل)
  const [nationalId, setNationalId] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  // خطوة 3
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  const isIndividual = accountType === 'individual';

  function goStep0Next() {
    if (!accountType) {
      setError('اختر نوع الحساب');
      return;
    }
    setError('');
    setStep(1);
  }

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
    if (isIndividual) {
      if (!storeName.trim() || !nationalId.trim() || !iban.trim()) {
        setError('عبّي الحقول الأساسية (اسمك المهني، رقم الهوية، الآيبان)');
        return;
      }
    } else {
      if (!storeName.trim() || !cr.trim() || !iban.trim()) {
        setError('عبّي الحقول الأساسية (اسم المحل، السجل التجاري، الآيبان)');
        return;
      }
    }
    if (!crFile) {
      setError(isIndividual ? 'ارفع صورة الهوية أو رخصة العمل الحر' : 'ارفع ملف السجل التجاري');
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
      form.append('providerType', accountType!);
      form.append('storeName', storeName);
      if (isIndividual) {
        form.append('nationalId', nationalId);
        if (serviceArea) form.append('serviceArea', serviceArea);
      } else {
        form.append('commercialRegisterNo', cr);
      }
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
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className={`step-dot ${step === n ? 'on' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2>نوع الحساب</h2>
            <p className="note" style={{ marginBottom: 14 }}>
              اختر اللي يناسبك — تقدر تسجّل محل له سجل تجاري، أو تسجّل كفني مستقل يقدّم الصيانة بنفسه.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                className={`chip ${accountType === 'company' ? 'on' : ''}`}
                style={{ textAlign: 'right', padding: 16, cursor: 'pointer', display: 'block' }}
                onClick={() => setAccountType('company')}
              >
                <b>🏪 محل / شركة</b>
                <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.85 }}>
                  عندك سجل تجاري، تبيع منتجات و/أو تقدّم خدمات صيانة من محل فعلي
                </div>
              </div>
              <div
                className={`chip ${accountType === 'individual' ? 'on' : ''}`}
                style={{ textAlign: 'right', padding: 16, cursor: 'pointer', display: 'block' }}
                onClick={() => setAccountType('individual')}
              >
                <b>🔧 فني مستقل</b>
                <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.85 }}>
                  ما عندك محل، بس عندك الخبرة — تقدّم خدمة الصيانة بنفسك (زيارة منزلية غالباً)
                </div>
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <button className="primary" style={{ width: '100%', marginTop: 14 }} onClick={goStep0Next}>
              التالي
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={goStep1Next}>
            <h2>{isIndividual ? 'بياناتك الشخصية' : 'بيانات ممثل الشركة'}</h2>
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
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(0)}>
                رجوع
              </button>
            </div>
          </form>
        )}

        {step === 2 && !isIndividual && (
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

        {step === 2 && isIndividual && (
          <form onSubmit={goStep2Next}>
            <h2>بيانات الفني المستقل</h2>
            <label htmlFor="storeName">اسمك المهني (يظهر للعملاء)</label>
            <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoFocus />
            <label htmlFor="nationalId">رقم الهوية الوطنية / الإقامة</label>
            <input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            <label htmlFor="serviceArea">المنطقة اللي تخدمها (اختياري)</label>
            <input
              id="serviceArea"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="مثال: الرياض - شمال المدينة"
            />
            <label htmlFor="tax">الرقم الضريبي (اختياري)</label>
            <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
            <label htmlFor="iban">رقم الآيبان</label>
            <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

            <FileField label="صورتك الشخصية" accept="image/*" file={logo} onChange={setLogo} previewAsImage />
            <FileField
              label="صورة الهوية أو رخصة العمل الحر"
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

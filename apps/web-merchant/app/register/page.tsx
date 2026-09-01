'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError, setSession } from '@/lib/api';
import { SubscriptionPlan, StoreProviderType, PLAN_LABEL, PLAN_LABEL_EN, PLAN_PRICE, PLAN_PRICE_EN } from '@/lib/types';
import FileField from '@/components/FileField';
import { useLocale } from '@/lib/i18n';

interface RegisterResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string };
  store: { id: string; status: string };
}

const PLANS: SubscriptionPlan[] = ['monthly', 'six_months', 'yearly'];

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const planLabel = locale === 'ar' ? PLAN_LABEL : PLAN_LABEL_EN;
  const planPrice = locale === 'ar' ? PLAN_PRICE : PLAN_PRICE_EN;
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
  const [freelanceLicenseNo, setFreelanceLicenseNo] = useState('');
  const [freelanceLicenseExpiry, setFreelanceLicenseExpiry] = useState('');

  // خطوة 3
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const isIndividual = accountType === 'individual';

  function goStep0Next() {
    if (!accountType) {
      setError(t('register.accountTypeError'));
      return;
    }
    setError('');
    setStep(1);
  }

  function goStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (!repName.trim() || !email.trim() || !password) {
      setError(t('register.fillAllFields'));
      return;
    }
    setError('');
    setStep(2);
  }

  function goStep2Next(e: React.FormEvent) {
    e.preventDefault();
    if (isIndividual) {
      if (!storeName.trim() || !nationalId.trim() || !iban.trim() || !freelanceLicenseNo.trim() || !freelanceLicenseExpiry) {
        setError(t('register.fillRequiredIndividual'));
        return;
      }
    } else {
      if (!storeName.trim() || !cr.trim() || !iban.trim()) {
        setError(t('register.fillRequiredCompany'));
        return;
      }
    }
    if (!crFile) {
      setError(isIndividual ? t('register.uploadIdOrLicense') : t('register.uploadCrFile'));
      return;
    }
    if (!bankFile) {
      setError(t('register.uploadBankFile'));
      return;
    }
    setError('');
    setStep(3);
  }

  async function handleSubmit() {
    if (!plan) {
      setError(t('register.choosePlan'));
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
        form.append('freelanceLicenseNo', freelanceLicenseNo);
        form.append('freelanceLicenseExpiry', freelanceLicenseExpiry);
        if (serviceArea) form.append('serviceArea', serviceArea);
      } else {
        form.append('commercialRegisterNo', cr);
      }
      if (tax) form.append('taxNo', tax);
      form.append('iban', iban);
      form.append('plan', plan);
      if (couponCode.trim()) form.append('couponCode', couponCode.trim());
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
      setError(err instanceof ApiError ? err.message : t('register.submitError'));
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
            <h2>{t('register.chooseAccountType')}</h2>
            <p className="note" style={{ marginBottom: 14 }}>
              {t('register.step0Note')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                className={`chip ${accountType === 'company' ? 'on' : ''}`}
                style={{ textAlign: 'right', padding: 16, cursor: 'pointer', display: 'block' }}
                onClick={() => setAccountType('company')}
              >
                <b>{t('register.companyOption')}</b>
                <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.85 }}>
                  {t('register.companyOptionNote')}
                </div>
              </div>
              <div
                className={`chip ${accountType === 'individual' ? 'on' : ''}`}
                style={{ textAlign: 'right', padding: 16, cursor: 'pointer', display: 'block' }}
                onClick={() => setAccountType('individual')}
              >
                <b>{t('register.individualOption')}</b>
                <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.85 }}>
                  {t('register.individualOptionNote')}
                </div>
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <button className="primary" style={{ width: '100%', marginTop: 14 }} onClick={goStep0Next}>
              {t('register.next')}
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={goStep1Next}>
            <h2>{isIndividual ? t('register.personalDataIndividual') : t('register.companyRepData')}</h2>
            <label htmlFor="repName">{t('register.fullName')}</label>
            <input id="repName" value={repName} onChange={(e) => setRepName(e.target.value)} autoFocus />
            <label htmlFor="email">{t('register.email')}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="password">{t('register.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="phone">{t('register.phoneOptional')}</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {error && <div className="err">{error}</div>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              {t('register.next')}
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(0)}>
                {t('register.back')}
              </button>
            </div>
          </form>
        )}

        {step === 2 && !isIndividual && (
          <form onSubmit={goStep2Next}>
            <h2>{t('register.basicStoreData')}</h2>
            <label htmlFor="storeName">{t('register.storeName')}</label>
            <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoFocus />
            <label htmlFor="cr">{t('register.crNo')}</label>
            <input id="cr" value={cr} onChange={(e) => setCr(e.target.value)} />
            <label htmlFor="tax">{t('register.taxNoOptional')}</label>
            <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
            <label htmlFor="iban">{t('register.iban')}</label>
            <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

            <FileField label={t('register.storeLogo')} accept="image/*" file={logo} onChange={setLogo} previewAsImage />
            <FileField
              label={t('register.crFileLabel')}
              required
              accept="image/*,.pdf"
              file={crFile}
              onChange={setCrFile}
            />
            <FileField
              label={t('register.bankFileLabel')}
              required
              accept="image/*,.pdf"
              file={bankFile}
              onChange={setBankFile}
            />
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '-6px 0 14px' }}>
              {t('register.acceptedFormats')}
            </p>

            {error && <div className="err">{error}</div>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              {t('register.next')}
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(1)}>
                {t('register.back')}
              </button>
            </div>
          </form>
        )}

        {step === 2 && isIndividual && (
          <form onSubmit={goStep2Next}>
            <h2>{t('register.individualData')}</h2>
            <label htmlFor="storeName">{t('register.professionalName')}</label>
            <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoFocus />
            <label htmlFor="nationalId">{t('register.nationalId')}</label>
            <input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            <label htmlFor="freelanceLicenseNo">{t('register.freelanceLicenseNo')}</label>
            <input
              id="freelanceLicenseNo"
              value={freelanceLicenseNo}
              onChange={(e) => setFreelanceLicenseNo(e.target.value)}
            />
            <label htmlFor="freelanceLicenseExpiry">{t('register.freelanceLicenseExpiry')}</label>
            <input
              id="freelanceLicenseExpiry"
              type="date"
              value={freelanceLicenseExpiry}
              onChange={(e) => setFreelanceLicenseExpiry(e.target.value)}
            />
            <label htmlFor="serviceArea">{t('register.serviceAreaOptional')}</label>
            <input
              id="serviceArea"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder={t('register.serviceAreaPlaceholder')}
            />
            <label htmlFor="tax">{t('register.taxNoOptional')}</label>
            <input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} />
            <label htmlFor="iban">{t('register.iban')}</label>
            <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />

            <FileField label={t('register.personalPhoto')} accept="image/*" file={logo} onChange={setLogo} previewAsImage />
            <FileField
              label={t('register.idOrLicensePhoto')}
              required
              accept="image/*,.pdf"
              file={crFile}
              onChange={setCrFile}
            />
            <FileField
              label={t('register.bankFileLabel')}
              required
              accept="image/*,.pdf"
              file={bankFile}
              onChange={setBankFile}
            />
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '-6px 0 14px' }}>
              {t('register.acceptedFormats')}
            </p>

            {error && <div className="err">{error}</div>}
            <button className="primary" type="submit" style={{ width: '100%' }}>
              {t('register.next')}
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(1)}>
                {t('register.back')}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div>
            <h2>{t('register.choosePlanHeading')}</h2>
            <div className="row2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {PLANS.map((p) => (
                <div
                  key={p}
                  className={`chip ${plan === p ? 'on' : ''}`}
                  style={{ textAlign: 'center', padding: 14, cursor: 'pointer', display: 'block' }}
                  onClick={() => setPlan(p)}
                >
                  {planLabel[p]}
                  <br />
                  <b>{planPrice[p]}</b>
                </div>
              ))}
            </div>
            <div style={{ height: 14 }} />
            <label htmlFor="couponCode">{t('register.couponCodeOptional')}</label>
            <input
              id="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t('register.couponPlaceholder')}
            />
            {error && <div className="err">{error}</div>}
            <button className="primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
              {loading ? t('register.submitting') : t('register.submitRequest')}
            </button>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="link" onClick={() => setStep(2)}>
                {t('register.back')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

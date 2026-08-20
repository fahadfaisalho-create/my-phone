'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'ar' | 'en';

const STORAGE_KEY = 'admin_locale';

// قاموس الترجمة — مفاتيح متداخلة بنقطة (topbar.exit). يُكمَّل تدريجياً مع كل قسم
// جديد يُترجم؛ أي مفتاح غير موجود بالقاموس يُعرض كما هو (بدون كسر الواجهة).
const dict = {
  ar: {
    topbar: {
      exit: 'خروج',
      lang: 'English',
    },
    login: {
      title: 'دخول الإدارة',
      email: 'البريد الإلكتروني',
      password: 'كلمة السر',
      submit: 'دخول',
      submitting: 'جارٍ الدخول...',
      forgot: 'نسيت كلمة السر؟',
      notAdmin: 'هذا الحساب ليس حساب إدارة',
      connectionError: 'تعذّر الاتصال بالخادم',
    },
    nav: {
      stores: 'طلبات التسجيل',
      orders: 'طلبات الشراء',
      coupons: 'كوبونات الخصم',
      ads: 'الإعلانات المميزة',
      support: 'تذاكر الدعم',
      reports: 'التقارير',
    },
    dashboard: {
      title: 'لوحة تحكم الإدارة',
      role: 'مدير',
    },
  },
  en: {
    topbar: {
      exit: 'Sign out',
      lang: 'العربية',
    },
    login: {
      title: 'Admin Sign In',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      forgot: 'Forgot password?',
      notAdmin: 'This account is not an admin account',
      connectionError: 'Could not connect to the server',
    },
    nav: {
      stores: 'Registration Requests',
      orders: 'Purchase Orders',
      coupons: 'Discount Coupons',
      ads: 'Featured Ads',
      support: 'Support Tickets',
      reports: 'Reports',
    },
    dashboard: {
      title: 'Admin Dashboard',
      role: 'Admin',
    },
  },
} as const;

function resolve(locale: Locale, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict[locale];
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return key;
  }
  return typeof node === 'string' ? node : key;
}

interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as Locale | null) : null;
    if (stored === 'ar' || stored === 'en') setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  const t = useCallback((key: string) => resolve(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, dir: locale === 'ar' ? ('rtl' as const) : ('ltr' as const), setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

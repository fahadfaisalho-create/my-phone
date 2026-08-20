import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Locale = 'ar' | 'en';

const STORAGE_KEY = 'consumer_locale';

// قاموس الترجمة — مفاتيح متداخلة بنقطة (home.brand). يُكمَّل تدريجياً مع كل شاشة
// جديدة تُترجم؛ أي مفتاح غير موجود بالقاموس يُعرض كما هو (بدون كسر الواجهة).
const dict = {
  ar: {
    common: {
      langToggle: 'English',
    },
    home: {
      brand: '📱 My Phone',
      hello: 'مرحباً بك 👋',
      helloName: (name: string) => `مرحباً، ${name}`,
      account: 'حسابي',
      login: 'دخول',
      searchPlaceholder: 'ابحث عن محل صيانة أو بيع جوالات...',
      chats: 'محادثاتي',
      bookings: 'حجوزاتي',
      orders: 'طلباتي',
      support: 'الدعم',
      featuredAds: '⭐ إعلانات مميزة',
      filterAll: 'الكل',
      filterIndividual: '🔧 فنيين مستقلين',
      filterCompany: '🏪 محلات',
      availableStores: 'المحلات المتاحة',
      noResults: 'لا يوجد نتائج مطابقة',
      noStoresYet: 'لا يوجد محلات نشطة بعد',
      noFilterMatch: 'لا يوجد محلات تطابق هذا الفلتر',
      loadError: 'تعذّر تحميل المحلات',
    },
    otpRequest: {
      title: 'تسجيل الدخول',
      subtitle: 'سنرسل لك رمز تحقق مكوّن من 6 أرقام عبر رسالة SMS',
      phoneLabel: 'رقم الجوال',
      phonePlaceholder: '05xxxxxxxx',
      submit: 'إرسال الرمز',
      submitting: 'جارٍ الإرسال...',
      genericError: 'تعذّر إرسال الرمز، حاول مرة أخرى',
      continueGuest: 'متابعة التصفح بدون تسجيل',
    },
  },
  en: {
    common: {
      langToggle: 'العربية',
    },
    home: {
      brand: '📱 My Phone',
      hello: 'Welcome 👋',
      helloName: (name: string) => `Hello, ${name}`,
      account: 'Account',
      login: 'Sign in',
      searchPlaceholder: 'Search for a repair shop or phone store...',
      chats: 'Chats',
      bookings: 'Bookings',
      orders: 'Orders',
      support: 'Support',
      featuredAds: '⭐ Featured',
      filterAll: 'All',
      filterIndividual: '🔧 Independent',
      filterCompany: '🏪 Stores',
      availableStores: 'Available Stores',
      noResults: 'No matching results',
      noStoresYet: 'No active stores yet',
      noFilterMatch: 'No stores match this filter',
      loadError: 'Failed to load stores',
    },
    otpRequest: {
      title: 'Sign In',
      subtitle: "We'll send you a 6-digit verification code via SMS",
      phoneLabel: 'Phone number',
      phonePlaceholder: '05xxxxxxxx',
      submit: 'Send code',
      submitting: 'Sending…',
      genericError: 'Could not send the code, please try again',
      continueGuest: 'Continue browsing without signing in',
    },
  },
};

function resolve(locale: Locale, key: string): unknown {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict[locale];
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return key;
  }
  return node;
}

interface LocaleContextValue {
  locale: Locale;
  isRTL: boolean;
  row: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  /** لمفاتيح تُرجع دالة (تحتاج متغيّر بالنص، مثل الترحيب بالاسم) */
  tf: (key: string, ...args: string[]) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'ar' || stored === 'en') setLocaleState(stored);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  const t = useCallback((key: string) => {
    const v = resolve(locale, key);
    return typeof v === 'string' ? v : key;
  }, [locale]);

  const tf = useCallback(
    (key: string, ...args: string[]) => {
      const v = resolve(locale, key);
      if (typeof v === 'function') return (v as (...a: string[]) => string)(...args);
      return typeof v === 'string' ? v : key;
    },
    [locale],
  );

  const isRTL = locale === 'ar';

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRTL,
      row: isRTL ? 'row-reverse' : 'row',
      textAlign: isRTL ? 'right' : 'left',
      setLocale,
      toggleLocale,
      t,
      tf,
    }),
    [locale, isRTL, setLocale, toggleLocale, t, tf],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

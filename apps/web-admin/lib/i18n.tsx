'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'ar' | 'en';

const STORAGE_KEY = 'admin_locale';

// قاموس الترجمة — مفاتيح متداخلة بنقطة (topbar.exit). يُكمَّل تدريجياً مع كل قسم
// جديد يُترجم؛ أي مفتاح غير موجود بالقاموس يُعرض كما هو (بدون كسر الواجهة).
const dict = {
  ar: {
    common: {
      loading: 'جارٍ التحميل...',
      saving: 'جارٍ الحفظ...',
      cancel: 'إلغاء',
      approve: 'قبول',
      reject: 'رفض',
      confirm: 'تأكيد',
      all: 'الكل',
      vatIncluded: 'شامل ضريبة',
      retry: 'إعادة المحاولة',
    },
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
      invoices: 'الفواتير',
      coupons: 'كوبونات الخصم',
      ads: 'الإعلانات المميزة',
      support: 'تذاكر الدعم',
      reports: 'التقارير',
      groupContent: 'المحتوى',
      groupManagement: 'الإدارة',
      groupAnalytics: 'التحليلات',
    },
    dashboard: {
      title: 'لوحة تحكم الإدارة',
      sidebarSubtitle: 'لوحة الإدارة',
      role: 'مدير',
    },
    stores: {
      tabPending: 'قيد المراجعة',
      tabActive: 'نشط',
      tabRejected: 'مرفوض',
      tabSuspended: 'موقوف',
      heading: 'طلبات وحسابات المحلات',
      loadError: 'تعذّر تحميل الطلبات',
      empty: 'لا يوجد محلات في هذه الحالة',
      notAttached: 'غير مرفق',
      idOrLicense: 'الهوية / رخصة العمل الحر',
      commercialRegister: 'السجل التجاري',
      bankCertificate: 'تصديق الحساب البنكي',
      individual: '🔧 فني مستقل',
      company: '🏪 محل',
      nationalIdLabel: 'رقم الهوية',
      crLabel: 'سجل تجاري',
      ibanLabel: 'آيبان',
      planLabel: 'الباقة',
      invoicePaid: 'فاتورة مدفوعة',
      invoiceUnpaid: 'فاتورة غير مدفوعة',
      unconfirmPayment: 'إلغاء تأكيد الدفع',
      confirmPayment: 'تأكيد استلام الدفع',
      rejectionReasonLabel: 'سبب الرفض',
      suspendStore: 'إيقاف المحل',
      reactivateStore: 'إعادة تفعيل المحل',
      rejectionPlaceholder: 'اكتب سبب الرفض ليصل للتاجر بالبريد...',
      confirmReject: 'تأكيد الرفض',
      suspendConfirm: (name: string) => `إيقاف "${name}"؟ سيختفي زر الشات/الحجز/الشراء عند المستهلكين.`,
      verifiedAtLabel: 'تاريخ التحقق',
      notVerifiedYet: 'لم يُوافَق عليه بعد',
      licenseExpiryLabel: 'انتهاء رخصة العمل الحر',
      licenseExpiryMissing: 'لم يُدخل التاجر تاريخ انتهاء',
      licenseExpired: 'منتهية',
      attachedDocs: 'المستندات المرفقة',
      approveRequest: 'قبول الطلب',
    },
    orders: {
      tabUnpaid: 'غير مدفوعة',
      tabPaid: 'مدفوعة',
      heading: 'طلبات الشراء',
      loadError: 'تعذّر تحميل الطلبات',
      updateError: 'تعذّر تحديث حالة الدفع',
      empty: 'لا يوجد طلبات في هذه الحالة',
      paid: 'مدفوع',
      refunded: 'مسترجع',
      unpaid: 'غير مدفوع',
      unconfirmPayment: 'إلغاء تأكيد الدفع',
      confirmPayment: 'تأكيد استلام الدفع',
    },
    invoices: {
      tabAll: 'الكل',
      tabFailed: 'فشل الإرسال',
      tabAccepted: 'مقبولة',
      heading: 'الفواتير الضريبية (زاتكا)',
      loadError: 'تعذّر تحميل الفواتير',
      empty: 'لا يوجد فواتير في هذه الحالة',
      resend: 'إعادة الإرسال',
      resending: 'جارٍ الإرسال...',
      resendError: 'تعذّر إعادة إرسال الفاتورة',
      attempts: 'عدد المحاولات',
      lastAttempt: 'آخر محاولة',
      lastError: 'آخر خطأ',
      billingSettingsHeading: 'بيانات البائع الرسمي على الفاتورة (زاتكا)',
      billingSettingsNote:
        'المنصة هي البائع الرسمي أمام زاتكا لكل فواتير المستهلكين — عبّئ بياناتها هنا قبل ربط الإرسال الفعلي. بدونها ستُرفض كل محاولات الإرسال.',
      platformLegalName: 'الاسم القانوني للمنصة',
      platformVatNo: 'الرقم الضريبي',
      platformCrNo: 'رقم السجل التجاري',
    },
    coupons: {
      createHeading: 'إنشاء كوبون خصم عام',
      createNote: 'يعمل هذا الكوبون على كل المتاجر بالمنصة. اختر نطاقه: طلبات شراء المستهلكين، اشتراكات المحلات بالمنصة، أو كلاهما.',
      code: 'كود الكوبون',
      codePlaceholder: 'مثال: WELCOME25',
      scope: 'نطاق التطبيق',
      scopeOrders: 'طلبات الشراء فقط',
      scopeSubscriptions: 'اشتراكات المحلات فقط',
      scopeBoth: 'طلبات الشراء + الاشتراكات',
      discountType: 'نوع الخصم',
      discountPercentage: 'نسبة مئوية',
      discountFixed: 'مبلغ ثابت',
      percentage: 'النسبة (%)',
      fixedAmount: 'المبلغ الثابت (﷼)',
      maxDiscount: 'حد أقصى لمبلغ الخصم (اختياري، ﷼)',
      maxDiscountPlaceholder: 'مثال: 20 — يعني 25% لكن لا يتجاوز 20 ﷼',
      startsAt: 'تاريخ البداية (اختياري)',
      expiresAt: 'تاريخ الانتهاء (اختياري)',
      usageLimit: 'حد أقصى لعدد مرات الاستخدام (اختياري)',
      usageLimitPlaceholder: 'بدون حد إذا تُرك فارغاً',
      create: 'إنشاء الكوبون',
      listHeading: 'الكوبونات العامة',
      empty: 'لا يوجد كوبونات بعد',
      loadError: 'تعذّر تحميل الكوبونات',
      createError: 'تعذّر إنشاء الكوبون',
      updateError: 'تعذّر تحديث الكوبون',
      deleteError: 'تعذّر حذف الكوبون',
      deleteConfirm: 'حذف هذا الكوبون نهائياً؟',
      disable: 'إيقاف',
      enable: 'تفعيل',
      delete: 'حذف',
      statusDisabled: 'موقوف',
      statusExpired: 'منتهي',
      statusNotStarted: 'لم يبدأ بعد',
      statusDepleted: 'استُنفد',
      statusActive: 'فعّال',
      usedCount: (used: string, limit: string) => `استُخدم ${used}${limit}`,
      from: 'من',
      until: 'حتى',
      discountLabel: 'خصم',
      capSuffix: (amount: string) => ` (بحد أقصى ${amount} ﷼)`,
      timesSuffix: ' مرة',
    },
    ads: {
      priceHeading: 'سعر الإعلان المميز اليومي',
      priceNote: 'هذا السعر هو ما يدفعه المحل عن كل يوم إعلان مميز يظهر بشريط "إعلانات مميزة" أعلى الصفحة الرئيسية بتطبيق المستهلك.',
      dailyPrice: 'السعر لليوم الواحد (﷼)',
      saveSuccess: 'تم حفظ السعر بنجاح',
      savePrice: 'حفظ السعر',
      loadError: 'تعذّر تحميل إعدادات الإعلانات',
      saveError: 'تعذّر حفظ السعر',
      revenueHeading: 'إيرادات الإعلانات',
      paidCount: 'إعلانات مدفوعة',
      totalRevenue: 'إجمالي إيراد الإعلانات',
    },
    support: {
      tabOpen: 'مفتوحة',
      tabInProgress: 'قيد المعالجة',
      tabClosed: 'مغلقة',
      heading: 'تذاكر الدعم',
      loadError: 'تعذّر تحميل التذاكر',
      updateError: 'تعذّر تحديث التذكرة',
      empty: 'لا يوجد تذاكر في هذه الحالة',
      fromStore: 'محل',
      fromConsumer: 'مستهلك',
      fromLabel: 'من',
      markInProgress: 'قيد المعالجة',
      close: 'إغلاق',
      reopen: 'إعادة فتح',
    },
    reports: {
      totalRevenueLabel: 'إجمالي الإيراد',
      totalRevenueNote: 'من كل الاشتراكات والطلبات المدفوعة حتى الآن',
      monthlyRevenueHeading: 'الإيراد الشهري (آخر 6 أشهر)',
      noRevenueYet: 'ما فيه إيراد مسجّل بعد خلال آخر 6 أشهر',
      storeStatusHeading: 'حالة المحلات',
      rejectedOrSuspended: 'مرفوض/موقوف',
      stores: 'المحلات',
      active: 'نشط',
      pending: 'قيد المراجعة',
      suspended: 'موقوف',
      subscriptions: 'الاشتراكات',
      subsPaid: 'اشتراكات مدفوعة',
      subsUnpaid: 'اشتراكات غير مدفوعة',
      subsRevenue: 'إيراد الاشتراكات',
      orders: 'الطلبات',
      ordersPaid: 'طلبات مدفوعة',
      ordersRevenue: 'إيراد الطلبات المدفوعة',
      ordersUnpaid: 'طلبات غير مدفوعة',
      bookings: 'الحجوزات',
      bookingsPending: 'قيد الانتظار',
      bookingsAccepted: 'مقبولة',
      bookingsCompleted: 'مكتملة',
      supportTickets: 'تذاكر الدعم',
      loadError: 'تعذّر تحميل التقارير',
    },
    forgotPassword: {
      requestTitle: 'استعادة كلمة السر',
      requestNote: 'أدخل بريدك الإلكتروني وسنرسل لك رمز استعادة.',
      email: 'البريد الإلكتروني',
      sendCode: 'إرسال رمز الاستعادة',
      sending: 'جارٍ الإرسال...',
      backToLogin: 'رجوع لتسجيل الدخول',
      resetTitle: 'إدخال رمز الاستعادة',
      tokenLabel: 'رمز الاستعادة (من البريد)',
      newPasswordLabel: 'كلمة السر الجديدة',
      updatePassword: 'تحديث كلمة السر',
      updating: 'جارٍ التحديث...',
      resend: 'لم يصلني رمز — إعادة الإرسال',
      connectionError: 'تعذّر الاتصال بالخادم',
      updateError: 'تعذّر تحديث كلمة السر',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      saving: 'Saving...',
      cancel: 'Cancel',
      approve: 'Approve',
      reject: 'Reject',
      confirm: 'Confirm',
      all: 'All',
      vatIncluded: 'VAT included',
      retry: 'Retry',
    },
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
      invoices: 'Invoices',
      coupons: 'Discount Coupons',
      ads: 'Featured Ads',
      support: 'Support Tickets',
      reports: 'Reports',
      groupContent: 'Content',
      groupManagement: 'Management',
      groupAnalytics: 'Analytics',
    },
    dashboard: {
      title: 'Admin Dashboard',
      sidebarSubtitle: 'Admin Panel',
      role: 'Admin',
    },
    stores: {
      tabPending: 'Pending',
      tabActive: 'Active',
      tabRejected: 'Rejected',
      tabSuspended: 'Suspended',
      heading: 'Store Requests & Accounts',
      loadError: 'Could not load requests',
      empty: 'No stores in this state',
      notAttached: 'Not attached',
      idOrLicense: 'National ID / Freelance license',
      commercialRegister: 'Commercial Register',
      bankCertificate: 'Bank Account Certificate',
      individual: '🔧 Independent Technician',
      company: '🏪 Store',
      nationalIdLabel: 'National ID',
      crLabel: 'CR number',
      ibanLabel: 'IBAN',
      planLabel: 'Plan',
      invoicePaid: 'Invoice paid',
      invoiceUnpaid: 'Invoice unpaid',
      unconfirmPayment: 'Unconfirm payment',
      confirmPayment: 'Confirm payment received',
      rejectionReasonLabel: 'Rejection reason',
      suspendStore: 'Suspend store',
      reactivateStore: 'Reactivate store',
      rejectionPlaceholder: "Write the rejection reason to send to the merchant's email...",
      confirmReject: 'Confirm rejection',
      suspendConfirm: (name: string) =>
        `Suspend "${name}"? The chat/booking/purchase button will disappear for consumers.`,
      verifiedAtLabel: 'Verified on',
      notVerifiedYet: 'Not approved yet',
      licenseExpiryLabel: 'Freelance license expiry',
      licenseExpiryMissing: 'Merchant did not enter an expiry date',
      licenseExpired: 'Expired',
      attachedDocs: 'Attached documents',
      approveRequest: 'Approve request',
    },
    orders: {
      tabUnpaid: 'Unpaid',
      tabPaid: 'Paid',
      heading: 'Purchase Orders',
      loadError: 'Could not load orders',
      updateError: 'Could not update payment status',
      empty: 'No orders in this state',
      paid: 'Paid',
      refunded: 'Refunded',
      unpaid: 'Unpaid',
      unconfirmPayment: 'Unconfirm payment',
      confirmPayment: 'Confirm payment received',
    },
    invoices: {
      tabAll: 'All',
      tabFailed: 'Failed to send',
      tabAccepted: 'Accepted',
      heading: 'Tax Invoices (ZATCA)',
      loadError: 'Could not load invoices',
      empty: 'No invoices in this state',
      resend: 'Resend',
      resending: 'Sending...',
      resendError: 'Could not resend the invoice',
      attempts: 'Attempts',
      lastAttempt: 'Last attempt',
      lastError: 'Last error',
      billingSettingsHeading: 'Official Seller Details on the Invoice (ZATCA)',
      billingSettingsNote:
        "The platform is the official seller of record for all consumer invoices — fill in its details here before connecting real submission. Without them, every send attempt will be rejected.",
      platformLegalName: 'Platform legal name',
      platformVatNo: 'VAT number',
      platformCrNo: 'Commercial register number',
    },
    coupons: {
      createHeading: 'Create a Platform-wide Coupon',
      createNote:
        'This coupon works across all stores on the platform. Choose its scope: consumer purchase orders, store platform subscriptions, or both.',
      code: 'Coupon code',
      codePlaceholder: 'e.g. WELCOME25',
      scope: 'Scope',
      scopeOrders: 'Purchase orders only',
      scopeSubscriptions: 'Store subscriptions only',
      scopeBoth: 'Purchase orders + subscriptions',
      discountType: 'Discount type',
      discountPercentage: 'Percentage',
      discountFixed: 'Fixed amount',
      percentage: 'Percentage (%)',
      fixedAmount: 'Fixed amount (SAR)',
      maxDiscount: 'Max discount amount (optional, SAR)',
      maxDiscountPlaceholder: 'e.g. 20 — meaning 25% but never more than 20 SAR',
      startsAt: 'Start date (optional)',
      expiresAt: 'Expiry date (optional)',
      usageLimit: 'Usage limit (optional)',
      usageLimitPlaceholder: 'No limit if left empty',
      create: 'Create Coupon',
      listHeading: 'Platform-wide Coupons',
      empty: 'No coupons yet',
      loadError: 'Could not load coupons',
      createError: 'Could not create the coupon',
      updateError: 'Could not update the coupon',
      deleteError: 'Could not delete the coupon',
      deleteConfirm: 'Delete this coupon permanently?',
      disable: 'Disable',
      enable: 'Enable',
      delete: 'Delete',
      statusDisabled: 'Disabled',
      statusExpired: 'Expired',
      statusNotStarted: 'Not started yet',
      statusDepleted: 'Depleted',
      statusActive: 'Active',
      usedCount: (used: string, limit: string) => `Used ${used}${limit}`,
      from: 'From',
      until: 'until',
      discountLabel: 'Discount',
      capSuffix: (amount: string) => ` (max ${amount} SAR)`,
      timesSuffix: ' times',
    },
    ads: {
      priceHeading: 'Daily Featured Ad Price',
      priceNote:
        'This is what a store pays per day their featured ad appears in the "Featured" strip on the consumer app home screen.',
      dailyPrice: 'Price per day (SAR)',
      saveSuccess: 'Price saved successfully',
      savePrice: 'Save Price',
      loadError: 'Could not load ad settings',
      saveError: 'Could not save the price',
      revenueHeading: 'Ad Revenue',
      paidCount: 'Paid ads',
      totalRevenue: 'Total ad revenue',
    },
    support: {
      tabOpen: 'Open',
      tabInProgress: 'In progress',
      tabClosed: 'Closed',
      heading: 'Support Tickets',
      loadError: 'Could not load tickets',
      updateError: 'Could not update the ticket',
      empty: 'No tickets in this state',
      fromStore: 'Store',
      fromConsumer: 'Consumer',
      fromLabel: 'From',
      markInProgress: 'In progress',
      close: 'Close',
      reopen: 'Reopen',
    },
    reports: {
      totalRevenueLabel: 'Total revenue',
      totalRevenueNote: 'From all paid subscriptions and orders so far',
      monthlyRevenueHeading: 'Monthly Revenue (last 6 months)',
      noRevenueYet: 'No revenue recorded yet in the last 6 months',
      storeStatusHeading: 'Store Status',
      rejectedOrSuspended: 'Rejected/Suspended',
      stores: 'Stores',
      active: 'Active',
      pending: 'Pending',
      suspended: 'Suspended',
      subscriptions: 'Subscriptions',
      subsPaid: 'Paid subscriptions',
      subsUnpaid: 'Unpaid subscriptions',
      subsRevenue: 'Subscription revenue',
      orders: 'Orders',
      ordersPaid: 'Paid orders',
      ordersRevenue: 'Paid order revenue',
      ordersUnpaid: 'Unpaid orders',
      bookings: 'Bookings',
      bookingsPending: 'Pending',
      bookingsAccepted: 'Accepted',
      bookingsCompleted: 'Completed',
      supportTickets: 'Support Tickets',
      loadError: 'Could not load reports',
    },
    forgotPassword: {
      requestTitle: 'Recover Password',
      requestNote: "Enter your email and we'll send you a recovery code.",
      email: 'Email',
      sendCode: 'Send Recovery Code',
      sending: 'Sending...',
      backToLogin: 'Back to sign in',
      resetTitle: 'Enter Recovery Code',
      tokenLabel: 'Recovery code (from email)',
      newPasswordLabel: 'New password',
      updatePassword: 'Update Password',
      updating: 'Updating...',
      resend: "Didn't receive it — resend",
      connectionError: 'Could not connect to the server',
      updateError: 'Could not update the password',
    },
  },
} as const;

function resolveRaw(locale: Locale, key: string): unknown {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict[locale];
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return key;
  }
  return node;
}

function resolve(locale: Locale, key: string): string {
  const v = resolveRaw(locale, key);
  return typeof v === 'string' ? v : key;
}

interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  /** لمفاتيح تُرجع دالة (تحتاج متغيّرات بالنص) */
  tf: (key: string, ...args: string[]) => string;
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
  const tf = useCallback(
    (key: string, ...args: string[]) => {
      const v = resolveRaw(locale, key);
      if (typeof v === 'function') return (v as (...a: string[]) => string)(...args);
      return typeof v === 'string' ? v : key;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir: locale === 'ar' ? ('rtl' as const) : ('ltr' as const), setLocale, toggleLocale, t, tf }),
    [locale, setLocale, toggleLocale, t, tf],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

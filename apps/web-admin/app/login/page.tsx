'use client';

import { useEffect } from 'react';

// دخول الإدمن صار جزءاً من صفحة الدخول الموحّدة على myphoneksa.com/login —
// نفس الرابط لكل الحسابات (تاجر / موظف / إدمن) عمداً، بلا أي إشارة لوجود
// حساب إدمن. هذا المسار باقٍ فقط لإعادة توجيه أي رابط قديم محفوظ
// (myphoneksa.com/admin/login) — التنقل بـ window.location وليس بموجّه
// Next.js حتى يتجاوز الـ basePath ('/admin') ويوصل لجذر الدومين فعلياً
export default function AdminLoginRedirectPage() {
  useEffect(() => {
    window.location.href = '/login';
  }, []);
  return null;
}

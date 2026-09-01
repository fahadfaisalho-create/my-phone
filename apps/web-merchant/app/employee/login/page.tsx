'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// دخول الحساب الفرعي (الموظف) انتقل ليصير جزءاً من صفحة الدخول الموحّدة —
// هذا المسار باقٍ فقط لإعادة توجيه أي رابط قديم محفوظ
export default function EmployeeLoginRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}

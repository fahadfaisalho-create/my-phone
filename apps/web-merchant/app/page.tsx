'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { routeForStatus } from '@/lib/routing';
import { Store } from '@/lib/types';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = getToken();
      const user = getUser();
      if (!token || user?.role !== 'merchant_rep') {
        router.replace('/entry');
        return;
      }
      try {
        const store = await apiFetch<Store>('/stores/me');
        router.replace(routeForStatus(store.status));
      } catch {
        router.replace('/entry');
      }
    })();
  }, [router]);

  return null;
}

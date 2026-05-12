'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ScreenLoader from '@/components/ui/screen-loader';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(`/dashboard/${user.role}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return <ScreenLoader />;
}

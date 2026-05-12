'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ScreenLoader from '@/components/ui/screen-loader';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Redirect to the appropriate dashboard based on role
      const role = user.role.toLowerCase();
      if (role === 'admin') {
        router.replace('/dashboard/admin');
      } else if (role === 'manager') {
        router.replace('/dashboard/manager');
      } else {
        router.replace('/dashboard/employee');
      }
    }
  }, [user, loading, router]);

  return <ScreenLoader />;
}


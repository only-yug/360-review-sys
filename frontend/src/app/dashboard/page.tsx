'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirect to the appropriate dashboard based on role
      const role = user.role.toLowerCase();
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'manager') {
        router.push('/dashboard/manager');
      } else {
        router.push('/dashboard/employee');
      }
    }
  }, [user, loading, router]);

  return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center space-y-6">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent shadow-xl"></div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter">Calibrating Workspace</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">Synchronizing your performance profile...</p>
          </div>
        </div>
      </div>
  );
}

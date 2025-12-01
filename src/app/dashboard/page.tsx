
'use client';

import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="container py-12 sm:py-16">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
        </div>
        <Skeleton className="h-10 w-1/3 mx-auto mb-8" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!user) {
    return redirect('/login');
  }

  return <DashboardClient user={user} />;
}

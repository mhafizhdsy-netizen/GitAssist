
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
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-3/5 mx-auto" />
          <Skeleton className="h-7 w-4/5 mx-auto mt-4" />
        </div>

        <div className="flex justify-center mb-8">
            <Skeleton className="h-14 w-full max-w-sm rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-3">
                <Skeleton className="h-[700px] w-full" />
            </div>
            <div className="lg:col-span-2">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return redirect('/login');
  }

  return <DashboardClient user={user} />;
}

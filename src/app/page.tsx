'use client';

import { redirect } from 'next/navigation';
import { useUser } from '@/firebase';
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";
import { Donate } from "@/components/landing/Donate";
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
       <div className="flex items-center justify-center min-h-screen w-full">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col">
      <Hero />
      <div className="bg-background">
        <Features />
        <HowItWorks />
        <FAQ />
        <Donate />
      </div>
    </div>
  );
}

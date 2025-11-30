
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Pages where the back button should NOT be displayed
  const noBackButtonPaths = ['/', '/dashboard'];

  if (noBackButtonPaths.includes(pathname)) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="fixed top-20 left-4 z-50"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handleBack}
        className="h-9 w-9 bg-background/50 backdrop-blur-md"
        aria-label="Kembali ke halaman sebelumnya"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </motion.div>
  );
}

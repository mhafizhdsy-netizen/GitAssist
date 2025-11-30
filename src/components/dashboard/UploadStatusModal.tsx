
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Github, X } from 'lucide-react';
import { motion } from 'framer-motion';

type ModalStatus = 'inactive' | 'processing' | 'committing' | 'done';

type UploadStatusModalProps = {
  status: ModalStatus;
  progress: number;
  commitUrl: string;
  repoName: string;
  onRestart: () => void;
};

export function UploadStatusModal({ status, progress, commitUrl, repoName, onRestart }: UploadStatusModalProps) {
  const isOpen = status !== 'inactive';

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-headline">Mengekstrak File ZIP</DialogTitle>
              <DialogDescription className="text-center">
                Harap tunggu, kami sedang memproses file Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
              </motion.div>
              <div className="w-full max-w-sm mx-auto pt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 font-medium">{Math.round(progress)}%</p>
              </div>
            </div>
          </>
        );
      case 'committing':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-headline">Melakukan Commit...</DialogTitle>
              <DialogDescription className="text-center">
                Mengirim perubahan Anda ke <span className="font-semibold text-primary">{repoName}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4 font-medium">Hampir selesai...</p>
              </motion.div>
            </div>
          </>
        );
      case 'done':
        return (
          <>
             <DialogClose asChild>
                <button 
                  onClick={onRestart}
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
            </DialogClose>
            <DialogHeader>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20"
                >
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </motion.div>
              <DialogTitle className="text-center text-2xl font-headline">Commit Berhasil!</DialogTitle>
              <DialogDescription className="text-center max-w-sm mx-auto">
                File Anda telah berhasil diunggah dan di-commit ke repositori.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 pb-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onRestart} size="lg" variant="outline">
                    Unggah Lagi
                </Button>
                <Button size="lg" asChild>
                    <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                    Lihat Commit <Github className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onRestart()}>
      <DialogContent className="glass-card w-[95vw] max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

    
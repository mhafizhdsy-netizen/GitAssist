'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Github, X, FileUp, GitCommit, Check, LucideIcon, AlertCircle, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export type ModalStatus = 'inactive' | 'processing' | 'committing' | 'done';
export type OperationType = 'commit' | 'issue' | 'release';

export type OperationStatus = {
  step: 'inactive' | 'preparing' | 'uploading' | 'finalizing';
  progress: number;
  text?: string;
  Icon?: LucideIcon;
};

type UploadStatusModalProps = {
  status: ModalStatus;
  operationStatus: OperationStatus;
  resultUrl: string;
  repoName: string;
  onRestart: () => void;
  operationType: OperationType;
};

const operationDetails = {
    commit: { title: "Melakukan Commit...", successTitle: "Commit Berhasil!", successDesc: "File Anda telah berhasil diunggah dan di-commit.", buttonText: "Lihat Commit"},
    issue: { title: "Membuat Issue...", successTitle: "Issue Dibuat!", successDesc: "Issue baru telah berhasil dibuat di repositori.", buttonText: "Lihat Issue"},
    release: { title: "Membuat Rilis...", successTitle: "Rilis Dibuat!", successDesc: "Rilis baru telah berhasil dipublikasikan.", buttonText: "Lihat Rilis"},
};


export function UploadStatusModal({ status, operationStatus, resultUrl, repoName, onRestart, operationType }: UploadStatusModalProps) {
  const isOpen = status !== 'inactive' && status !== 'processing';
  const isProcessing = status === 'processing';
  
  const { toast } = useToast();
  
  const details = operationDetails[operationType];

  const handleDone = () => {
    onRestart();
    toast({
        title: details.successTitle,
        description: "Operasi berhasil diselesaikan.",
        variant: "success",
    });
  }
  
  const CurrentStepIcon = operationStatus.Icon || FileUp;

  return (
    <>
    {isProcessing && (
        <div className="fixed inset-0 z-[101] bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md p-6"
            >
                <div className="py-8 px-4 space-y-6 text-center">
                    <motion.div
                        key={operationStatus.step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <CurrentStepIcon className="h-12 w-12 text-primary mb-4" />
                        <p className="text-lg font-medium text-foreground">{details.title}</p>
                        <p className="text-muted-foreground">{operationStatus.text || "Mempersiapkan..."}</p>
                    </motion.div>
                    <div className="w-full max-w-sm mx-auto pt-4">
                        <Progress value={operationStatus.progress} className="h-2 transition-all duration-300 ease-linear" />
                        <p className="text-sm text-muted-foreground mt-2 text-center font-medium">{Math.round(operationStatus.progress)}%</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )}
    <Dialog open={isOpen && !isProcessing} onOpenChange={(open) => !open && onRestart()}>
      <DialogContent className="glass-card w-[95vw] max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogClose asChild>
                <button 
                  onClick={handleDone}
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
              <DialogTitle className="text-center text-2xl font-headline">{details.successTitle}</DialogTitle>
              <DialogDescription className="text-center max-w-sm mx-auto">
                {details.successDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="pt-6 pb-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleDone} size="lg" variant="outline">
                    Selesai
                </Button>
                <Button size="lg" asChild>
                    <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                    {details.buttonText} <Github className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
      </DialogContent>
    </Dialog>
    </>
  );
}


'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Github, X, FileUp, GitCommit, LucideIcon, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export type ModalStatus = 'inactive' | 'processing' | 'committing' | 'done';
export type CommitStatus = {
  step: 'preparing' | 'uploading' | 'finalizing';
  progress: number;
};
export type OperationType = 'commit' | 'issue' | 'release';

export type OperationStatus = {
  step: 'inactive' | 'preparing' | 'uploading' | 'finalizing';
  progress: number;
  text?: string;
  Icon?: LucideIcon;
};

type UploadStatusModalProps = {
  status: ModalStatus;
  zipExtractProgress?: number;
  commitStatus?: CommitStatus;
  commitUrl?: string;
  operationStatus?: OperationStatus;
  resultUrl?: string;
  repoName: string;
  onRestart: () => void;
  operationType?: OperationType;
};

const operationDetails: Record<OperationType, { title: string, successTitle: string, successDesc: string, buttonText: string }> = {
    commit: { title: "Melakukan Commit...", successTitle: "Commit Berhasil!", successDesc: "File Anda telah berhasil diunggah dan di-commit.", buttonText: "Lihat Commit"},
    issue: { title: "Membuat Issue...", successTitle: "Issue Dibuat!", successDesc: "Issue baru telah berhasil dibuat di repositori.", buttonText: "Lihat Issue"},
    release: { title: "Membuat Rilis...", successTitle: "Rilis Dibuat!", successDesc: "Rilis baru telah berhasil dipublikasikan.", buttonText: "Lihat Rilis"},
};


export function UploadStatusModal({ status, zipExtractProgress, commitStatus, commitUrl, operationStatus, resultUrl, repoName, onRestart, operationType = 'commit' }: UploadStatusModalProps) {
  const isOpen = status !== 'inactive';
  const isProcessing = status === 'processing' || status === 'committing';
  
  const { toast } = useToast();
  
  const details = operationDetails[operationType];
  const finalUrl = resultUrl || commitUrl;
  
  const handleDone = () => {
    onRestart();
    if (status === 'done') {
        toast({
            title: details.successTitle,
            description: "Operasi berhasil diselesaikan.",
            variant: "success",
        });
    }
  }
  
  const getProcessingContent = () => {
    if (operationType === 'commit') {
        if (status === 'processing') {
            return {
                Icon: FileUp,
                title: 'Memproses File ZIP...',
                text: 'Mengekstrak file dari arsip...',
                progress: zipExtractProgress ?? 0
            }
        }
        if (status === 'committing') {
            return {
                Icon: GitCommit,
                title: 'Melakukan Commit...',
                text: `${commitStatus?.step === 'preparing' ? 'Mempersiapkan commit...' : commitStatus?.step === 'uploading' ? 'Mengunggah file...' : 'Menyelesaikan...'}`,
                progress: commitStatus?.progress ?? 0
            }
        }
    }
    
    if (operationStatus) {
        return {
            Icon: operationStatus.Icon || FileUp,
            title: details.title,
            text: operationStatus.text || "Mempersiapkan...",
            progress: operationStatus.progress
        }
    }
    
    // Fallback for commit if operationStatus is not provided
    return {
        Icon: FileUp,
        title: "Memproses...",
        text: "Harap tunggu...",
        progress: 50
    };
  }

  const { Icon, title, text, progress } = getProcessingContent();

  if (status === 'inactive') return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onRestart()}>
      <DialogContent 
        className="glass-card w-[95vw] max-w-md"
        onInteractOutside={(e) => {
            if (status !== 'done') e.preventDefault();
        }}
        hideCloseButton={status !== 'done'}
      >
        {isProcessing && (
             <div className="py-8 px-4 space-y-6 text-center">
                 <motion.div
                     key={status + text}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}
                     className="flex flex-col items-center justify-center text-center"
                 >
                     <Icon className="h-12 w-12 text-primary mb-4" />
                     <p className="text-lg font-medium text-foreground">{title}</p>
                     <p className="text-muted-foreground">{text}</p>
                 </motion.div>
                 <div className="w-full max-w-sm mx-auto pt-4">
                     <Progress value={progress} className="h-2 transition-all duration-300 ease-linear" />
                     <p className="text-sm text-muted-foreground mt-2 text-center font-medium">{Math.round(progress)}%</p>
                 </div>
             </div>
        )}
        {status === 'done' && (
            <>
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
                    {finalUrl && (
                        <Button size="lg" asChild>
                            <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                            {details.buttonText} <Github className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}

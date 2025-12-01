
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchRepoContents, type RepoContent } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File as FileIcon, Home, ChevronRight, ServerCrash, X } from 'lucide-react';
import Link from 'next/link';

type RepoPathPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPathSelect: (path: string) => void;
  githubToken: string;
  owner: string;
  repoName: string;
};

export function RepoPathPickerModal({ isOpen, onClose, onPathSelect, githubToken, owner, repoName }: RepoPathPickerModalProps) {
  const [contents, setContents] = useState<RepoContent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('');

  const loadContents = useCallback((path: string) => {
    if (!githubToken) return;
    
    setLoading(true);
    setError(null);
    fetchRepoContents(githubToken, owner, repoName, path)
      .then(data => {
        if (typeof data === 'string') {
          // This modal should only list folder contents, not file content
          setError("Tidak dapat memilih file, harap pilih folder.");
          setContents([]);
        } else {
          setContents(data);
        }
      })
      .catch(err => {
        console.error("Gagal mengambil isi repositori:", err);
        setError(err.message || "Gagal memuat konten.");
        setContents([]);
      })
      .finally(() => setLoading(false));
  }, [githubToken, owner, repoName]);

  useEffect(() => {
    if (isOpen) {
      loadContents(currentPath);
    } else {
      // Reset path when modal is closed
      setCurrentPath('');
    }
  }, [isOpen, currentPath, loadContents]);

  const handleItemClick = (item: RepoContent) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path);
    }
  };

  const handleSelectCurrentPath = () => {
    onPathSelect(currentPath);
  };
  
  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(Boolean);

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap bg-background/50 p-2 rounded-md border">
        <button onClick={() => setCurrentPath('')} className="flex items-center gap-1.5 hover:text-foreground">
          <Home className="h-4 w-4 flex-shrink-0" />
          {repoName}
        </button>
        {pathParts.map((part, index) => {
          const path = pathParts.slice(0, index + 1).join('/');
          return (
            <div key={path} className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <button
                onClick={() => setCurrentPath(path)}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Folder className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[150px]">{part}</span>
              </button>
            </div>
          )
        })}
      </nav>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 flex flex-col items-center gap-4">
          <ServerCrash className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-semibold">Gagal Memuat Konten</p>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          <Button onClick={() => loadContents(currentPath)}>Coba lagi</Button>
        </div>
      );
    }
    
    const directories = contents?.filter(item => item.type === 'dir') || [];
    const files = contents?.filter(item => item.type === 'file') || [];

    if (directories.length === 0 && files.length === 0) {
        return (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <Folder className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Folder ini kosong.</p>
          </div>
        );
    }

    return (
      <ScrollArea className="h-80 mt-4">
        <ul className="space-y-1">
          {directories.map(item => (
            <li key={item.sha}>
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
              >
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="flex-grow truncate">{item.name}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            </li>
          ))}
          {files.map(item => (
             <li key={item.sha} className="flex items-center gap-3 p-2 rounded-md text-muted-foreground/70">
                 <FileIcon className="h-5 w-5 flex-shrink-0" />
                 <span className="flex-grow truncate">{item.name}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Pilih Folder Tujuan</DialogTitle>
          <DialogDescription>
            Pilih folder di dalam repositori <span className="font-bold text-primary">{repoName}</span> tempat file akan diunggah.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <Breadcrumbs />
            {renderContent()}
        </div>

        <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Batal
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleSelectCurrentPath}>
                Pilih Folder &quot;{currentPath || repoName}&quot;
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

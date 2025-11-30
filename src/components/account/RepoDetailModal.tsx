
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fetchRepoContents, type Repo, type RepoContent } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File as FileIcon, Home, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type RepoDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  repo: Repo;
  githubToken: string;
};

export default function RepoDetailModal({ isOpen, onClose, repo, githubToken }: RepoDetailModalProps) {
  const [contents, setContents] = useState<(RepoContent[] | string) | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadContents = useCallback((path: string) => {
    setLoading(true);
    setError(null);
    setContents(null);
    fetchRepoContents(githubToken, repo.owner.login, repo.name, path)
      .then(data => {
        setContents(data);
        setCurrentPath(path);
      })
      .catch(err => {
        console.error("Gagal mengambil isi repositori:", err);
        setError(err.message || "Gagal memuat konten.");
        toast({
          title: "Error",
          description: "Tidak dapat memuat konten repositori.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [githubToken, repo.owner.login, repo.name, toast]);

  useEffect(() => {
    if (isOpen) {
      loadContents('');
    } else {
      // Reset state when modal is closed
      setTimeout(() => {
        setCurrentPath('');
        setContents(null);
        setLoading(true);
        setError(null);
      }, 300); // Delay to allow for closing animation
    }
  }, [isOpen, loadContents]);

  const handleItemClick = (item: RepoContent) => {
    if (item.type === 'dir' || item.type === 'file') {
      loadContents(item.path);
    }
  };
  
  const handleBreadcrumbClick = (path: string) => {
      loadContents(path);
  };

  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    const isFile = typeof contents === 'string';

    return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap bg-background/50 p-2 rounded-md">
            <button onClick={() => handleBreadcrumbClick('')} className="flex items-center gap-1 hover:text-foreground">
                <Home className="h-4 w-4" />
            </button>
            {(pathParts.length > 0) && <ChevronRight className="h-4 w-4" />}
            {pathParts.map((part, index) => {
                const path = pathParts.slice(0, index + 1).join('/');
                const isLast = index === pathParts.length - 1;
                return (
                    <div key={path} className="flex items-center gap-1.5">
                        <button 
                            onClick={() => !isLast && handleBreadcrumbClick(path)} 
                            className={`hover:text-foreground ${isLast ? 'text-foreground font-medium' : ''}`}
                            disabled={isLast && isFile}
                        >
                            {part}
                        </button>
                        {!isLast && <ChevronRight className="h-4 w-4" />}
                    </div>
                )
            })}
        </div>
    )
  }

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
      return <p className="text-destructive text-center mt-4">{error}</p>;
    }

    if (typeof contents === 'string') {
        return (
            <ScrollArea className="h-[60vh] lg:h-[50vh] mt-4 rounded-md border bg-background/50">
                <pre className="p-4 text-sm font-mono">{contents}</pre>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        )
    }

    if (Array.isArray(contents) && contents.length > 0) {
      return (
        <ScrollArea className="h-[60vh] lg:h-[50vh] mt-4">
            <ul className="space-y-1">
            {contents.map(item => (
                <li key={item.sha}>
                <button
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left"
                >
                    {item.type === 'dir' ? (
                    <Folder className="h-5 w-5 text-primary" />
                    ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="flex-grow truncate">{item.name}</span>
                    {item.type === 'dir' && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </button>
                </li>
            ))}
            </ul>
        </ScrollArea>
      );
    }
    
    return <p className="text-center mt-4 py-8 text-muted-foreground">Folder ini kosong.</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl glass-card">
        <DialogHeader>
          <DialogTitle className="truncate">Menjelajahi: {repo.full_name}</DialogTitle>
          <DialogDescription>
            Jelajahi file dan folder di dalam repositori.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
            <Breadcrumbs />
            {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

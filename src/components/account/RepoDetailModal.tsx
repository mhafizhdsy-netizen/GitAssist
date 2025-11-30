
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fetchRepoContents, type Repo, type RepoContent } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File as FileIcon, Home, ChevronRight, ServerCrash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';

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
    }
  }, [isOpen, loadContents]);

  const handleBreadcrumbClick = (path: string) => {
      loadContents(path);
  };
  
  const handleItemClick = (item: RepoContent) => {
    if (item.type === 'dir' || item.type === 'file') {
      loadContents(item.path);
    }
  };

  const Breadcrumbs = () => {
    const pathParts = ['root', ...currentPath.split('/').filter(Boolean)];

    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap bg-background/50 p-2 rounded-md border">
        {pathParts.map((part, index) => {
          const path = pathParts.slice(1, index + 1).join('/');
          const isLast = index === pathParts.length - 1;
          
          return (
            <div key={path} className="flex items-center gap-1.5">
              <button
                onClick={() => handleBreadcrumbClick(path)}
                className={`flex items-center gap-1.5 ${isLast ? 'text-foreground font-medium cursor-default' : 'hover:text-foreground'}`}
                disabled={isLast}
              >
                {part === 'root' ? <Home className="h-4 w-4 flex-shrink-0" /> : <Folder className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate max-w-[150px]">{part === 'root' ? repo.name : part}</span>
              </button>
              {!isLast && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            </div>
          )
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2 mt-4">
          {Array.from({ length: 7 }).map((_, i) => (
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

    if (typeof contents === 'string') {
      return (
        <ScrollArea className="h-[60vh] mt-4 rounded-md border bg-black/50">
          <pre className="p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">
            <code>{contents}</code>
          </pre>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )
    }

    if (Array.isArray(contents)) {
      if (contents.length === 0) {
        return (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <Folder className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Folder ini kosong.</p>
          </div>
        );
      }
      return (
        <ScrollArea className="h-[60vh] mt-4">
          <ul className="space-y-1">
            {contents.map(item => (
              <li key={item.sha}>
                <button
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                >
                  {item.type === 'dir' ? (
                    <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-grow truncate">{item.name}</span>
                  {item.type === 'dir' && <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] glass-card">
        <DialogHeader>
          <DialogTitle className="truncate">{repo.full_name}</DialogTitle>
        </DialogHeader>
        <div>
          <Breadcrumbs />
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    
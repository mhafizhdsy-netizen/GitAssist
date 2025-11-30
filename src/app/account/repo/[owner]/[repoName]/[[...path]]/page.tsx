
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { fetchRepoContents, type RepoContent } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File as FileIcon, Home, ChevronRight, ServerCrash, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Link from 'next/link';

type RepoDetailPageProps = {
    params: {
        owner: string;
        repoName: string;
        path?: string[];
    };
};

const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileName);
};

export default function RepoDetailPage({ params }: RepoDetailPageProps) {
  const { user } = useUser();
  const [contents, setContents] = useState<(RepoContent[] | string) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [githubToken, setGithubToken] = useState<string | null>(null);
  
  const { owner, repoName } = params;
  const currentPath = params.path?.join('/') || '';

  useEffect(() => {
    const token = localStorage.getItem('github-token');
    if (token) {
        setGithubToken(token);
    }
  }, []);

  const loadContents = useCallback((path: string) => {
    if (!githubToken) return;
    
    setLoading(true);
    setError(null);
    fetchRepoContents(githubToken, owner, repoName, path)
      .then(data => {
        setContents(data);
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
  }, [githubToken, owner, repoName, toast]);

  useEffect(() => {
    if (githubToken) {
        loadContents(currentPath);
    }
  }, [githubToken, currentPath, loadContents]);

  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(Boolean);

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap bg-background/50 p-2 rounded-md border">
        <Link href={`/account/repo/${owner}/${repoName}`} className="flex items-center gap-1.5 hover:text-foreground">
          <Home className="h-4 w-4 flex-shrink-0" />
          {repoName}
        </Link>
        {pathParts.map((part, index) => {
          const path = pathParts.slice(0, index + 1).join('/');
          const isLast = index === pathParts.length - 1;
          
          return (
            <div key={path} className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <Link
                href={`/account/repo/${owner}/${repoName}/${path}`}
                className={`flex items-center gap-1.5 ${isLast ? 'text-foreground font-medium cursor-default pointer-events-none' : 'hover:text-foreground'}`}
                aria-current={isLast ? 'page' : undefined}
              >
                <Folder className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[150px]">{part}</span>
              </Link>
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
        const fileName = currentPath.split('/').pop() || '';
        if (isImage(fileName) && githubToken) {
            const imageUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${currentPath}`;
            return (
                <div className="mt-4 p-4 border rounded-lg bg-black/50 flex justify-center items-center">
                    <img 
                      src={imageUrl} 
                      alt={fileName} 
                      className="max-w-full max-h-[70vh] rounded"
                      // This is a way to pass the auth token for images
                      ref={img => {
                          if (img) {
                              fetch(imageUrl, { headers: { 'Authorization': `token ${githubToken}` } })
                                .then(res => res.blob())
                                .then(blob => {
                                  img.src = URL.createObjectURL(blob);
                                });
                          }
                      }}
                    />
                </div>
            );
        }
      return (
        <ScrollArea className="h-[70vh] mt-4 rounded-md border bg-black/50">
          <pre className="p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap">
            <code>{contents}</code>
          </pre>
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
        <ScrollArea className="h-[70vh] mt-4">
          <ul className="space-y-1">
            {contents.map(item => (
              <li key={item.sha}>
                <Link
                  href={`/account/repo/${owner}/${repoName}/${item.path}`}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                >
                  {item.type === 'dir' ? (
                    <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : isImage(item.name) ? (
                    <ImageIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-grow truncate">{item.name}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      );
    }
    
    return null;
  };

  return (
    <motion.div
        className="container py-12 sm:py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-4 truncate">{owner} / {repoName}</h1>
        <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
                <Breadcrumbs />
                {renderContent()}
            </CardContent>
        </Card>
    </motion.div>
  );
}

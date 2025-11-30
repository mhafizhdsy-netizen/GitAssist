
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { fetchUserRepos, type Repo } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, GitFork, Code, ArrowLeft, ArrowRight, Eye, BookText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import RepoDetailModal from '@/components/account/RepoDetailModal';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function AccountPage() {
  const { user, loading: userLoading } = useUser();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  useEffect(() => {
    const token = sessionStorage.getItem('github-token');
    if (token) {
      setGithubToken(token);
    } else {
      setError("Token GitHub tidak ditemukan. Silakan masuk kembali.");
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      redirect('/login');
      return;
    }
    if (!githubToken) return;

    setReposLoading(true);
    fetchUserRepos(githubToken, page, 9)
      .then(newRepos => {
        setRepos(newRepos);
        setHasMore(newRepos.length === 9);
        setError(null);
      })
      .catch(err => {
        console.error("Gagal mengambil repositori:", err);
        setError(err.message || "Gagal mengambil data repositori.");
      })
      .finally(() => {
        setReposLoading(false);
      });

  }, [user, userLoading, page, githubToken]);

  const handleViewRepo = (repo: Repo) => {
    setSelectedRepo(repo);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
    } catch (e) {
        return dateString;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  if (userLoading) {
    return (
      <div className="container py-12 sm:py-16">
        <div className="flex flex-col items-center justify-center gap-4 mb-12">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="glass-card h-64"><CardContent className="p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <motion.div 
        className="container py-12 sm:py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
            >
              <Avatar className="h-24 w-24 border-4 border-primary/50">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User Avatar'} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold font-headline">{user.displayName}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-headline mb-8 text-center">Repositori Saya</h2>
          
          {error && !reposLoading && (
            <div className="text-center py-10">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Coba Lagi</Button>
            </div>
          )}

          {reposLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="glass-card h-64"><CardContent className="p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              {repos.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {repos.map(repo => (
                    <motion.div key={repo.id} variants={itemVariants}>
                      <Card className="glass-card flex flex-col h-full hover:border-primary/50 transition-colors duration-300">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <BookText className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                            <div className="flex-grow">
                              <CardTitle className="leading-snug">
                                <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {repo.name}
                                </Link>
                              </CardTitle>
                              <CardDescription className="mt-2 h-10 text-ellipsis-2-lines">
                                {repo.description || "Tidak ada deskripsi"}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                          {repo.topics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {repo.topics.slice(0, 3).map(topic => (
                                    <Badge key={topic} variant="secondary" className="font-normal">{topic}</Badge>
                                ))}
                            </div>
                          )}
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {repo.language && (
                              <span className="flex items-center gap-1.5">
                                <Code className="h-4 w-4 text-primary" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-yellow-400" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <GitFork className="h-4 w-4 text-green-400" />
                              {repo.forks_count}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2 pt-4">
                            <Button variant="outline" className="w-full" onClick={() => handleViewRepo(repo)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Isi
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Diperbarui {formatDate(repo.updated_at)}
                            </p>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">Anda tidak memiliki repositori.</p>
              )}
              
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || reposLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Sebelumnya
                </Button>
                <span className="text-sm font-medium">Halaman {page}</span>
                <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={!hasMore || reposLoading}>
                  Berikutnya <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
      
      {selectedRepo && githubToken && (
        <RepoDetailModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          repo={selectedRepo}
          githubToken={githubToken}
        />
      )}
      
      <style jsx>{`
        .text-ellipsis-2-lines {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </>
  );
}

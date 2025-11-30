
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
import { Star, GitFork, Code, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import RepoDetailModal from '@/components/account/RepoDetailModal';

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
    // Moved token retrieval to its own effect to run once on mount
    const token = sessionStorage.getItem('github-token');
    if (!token) {
      setError("Token GitHub tidak ditemukan. Silakan masuk kembali.");
    } else {
      setGithubToken(token);
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      redirect('/login');
      return;
    }

    if (!githubToken) {
      setReposLoading(false);
      return;
    }

    setReposLoading(true);
    fetchUserRepos(githubToken, page, 9)
      .then(newRepos => {
        setRepos(newRepos);
        setHasMore(newRepos.length === 9);
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

  if (userLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-32 w-full max-w-4xl mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-7xl mx-auto">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const formatDate = (dateString: string) => {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
    } catch (e) {
        return dateString;
    }
  };

  return (
    <>
    <div className="container py-12 sm:py-16">
      <Card className="max-w-4xl mx-auto glass-card mb-12 shadow-2xl shadow-primary/10">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary/50">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User Avatar'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold font-headline">{user.displayName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold font-headline mb-8 text-center">Repositori Saya</h2>
        {error && !reposLoading && <p className="text-center text-destructive">{error}</p>}
        {reposLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                    <Card key={i} className="glass-card"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                ))}
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map(repo => (
                    <Card key={repo.id} className="glass-card flex flex-col h-full hover:border-primary/50 transition-colors duration-300">
                        <CardHeader>
                            <CardTitle className="truncate">
                                <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {repo.name}
                                </Link>
                            </CardTitle>
                            <CardDescription className="h-12 text-ellipsis-3-lines">
                                {repo.description || "Tidak ada deskripsi"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
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
                             <p className="text-xs text-muted-foreground pt-2">
                                Diperbarui {formatDate(repo.updated_at)}
                            </p>
                        </CardContent>
                        <CardFooter>
                           <Button variant="outline" className="w-full" onClick={() => handleViewRepo(repo)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Isi
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                </div>
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || reposLoading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Sebelumnya
                    </Button>
                    <span className="text-sm font-medium">Halaman {page}</span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore || reposLoading}
                    >
                        Berikutnya <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </>
        )}
      </div>
    </div>
    {selectedRepo && githubToken && (
        <RepoDetailModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            repo={selectedRepo}
            githubToken={githubToken}
        />
    )}
    <style jsx>{`
      .text-ellipsis-3-lines {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;  
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `}</style>
    </>
  );
}

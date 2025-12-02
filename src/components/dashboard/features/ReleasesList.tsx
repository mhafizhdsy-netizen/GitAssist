
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Release } from '@/app/actions';
import { Rocket, CheckCircle2, AlertTriangle, GitCommit, Download, FileArchive, FileCode, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

type ReleasesListProps = {
  releases: Release[];
  isLoading: boolean;
  repoName?: string;
};

export function ReleasesList({ releases, isLoading, repoName }: ReleasesListProps) {
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'beberapa waktu lalu';
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
    } catch (e) {
        return dateString;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-background/30 p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </Card>
          ))}
        </div>
      );
    }

    if (!repoName) {
      return (
        <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Pilih repositori untuk melihat rilis.</p>
        </div>
      );
    }
    
    if (releases.length === 0) {
        return (
            <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-lg">Belum Ada Rilis</p>
                <p className="text-muted-foreground">Tidak ada rilis yang ditemukan di repositori ini.</p>
            </div>
        );
    }

    return (
      <TooltipProvider>
        <ul className="space-y-3">
          {releases.map(release => (
            <li key={release.id}>
              <Card className="bg-background/40 hover:bg-accent/50 transition-colors">
                <CardHeader className="p-4 flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg">
                           <Link href={release.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                             {release.name || release.tag_name}
                           </Link>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            <Badge variant="secondary" className="mr-2">{release.tag_name}</Badge>
                            dirilis {formatDate(release.published_at)}
                        </CardDescription>
                    </div>
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={release.author?.avatar_url} alt={release.author?.login || ''} />
                                <AvatarFallback>
                                    {release.author ? release.author.login.charAt(0) : <Tag className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{release.author?.login || `Dibuat dari tag oleh sistem`}</p>
                        </TooltipContent>
                    </Tooltip>
                </CardHeader>
                {(release.assets.length > 0 || release.zipball_url) && (
                    <CardContent className="p-4 pt-0">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Aset:</p>
                        <div className="flex flex-wrap gap-2">
                             {release.assets.map(asset => (
                                 <Button key={asset.id} variant="outline" size="sm" asChild>
                                     <a href={asset.browser_download_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-1.5 h-3.5 w-3.5"/> {asset.name}
                                     </a>
                                 </Button>
                             ))}
                             {release.zipball_url && (
                                <Button variant="outline" size="sm" asChild>
                                     <a href={release.zipball_url}>
                                        <FileArchive className="mr-1.5 h-3.5 w-3.5"/> Source code (zip)
                                     </a>
                                 </Button>
                             )}
                              {release.tarball_url && (
                                <Button variant="outline" size="sm" asChild>
                                     <a href={release.tarball_url}>
                                        <FileCode className="mr-1.5 h-3.5 w-3.5"/> Source code (tar.gz)
                                     </a>
                                 </Button>
                             )}
                        </div>
                    </CardContent>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    );
  };

  return (
    <Card className="glass-card flex flex-col h-full min-h-[500px]">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
            <Rocket className="text-primary"/> Daftar Rilis
        </CardTitle>
        {repoName && <CardDescription>Menampilkan rilis untuk <span className="font-bold text-primary">{repoName}</span></CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

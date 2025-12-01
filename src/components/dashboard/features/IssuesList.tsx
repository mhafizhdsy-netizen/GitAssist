
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Issue } from '@/app/actions';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

type IssuesListProps = {
  issues: Issue[];
  isLoading: boolean;
  repoName?: string;
};

export function IssuesList({ issues, isLoading, repoName }: IssuesListProps) {
  
  const formatDate = (dateString: string) => {
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
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!repoName) {
      return (
        <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Pilih repositori untuk melihat issues.</p>
        </div>
      );
    }
    
    if (issues.length === 0) {
        return (
            <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-lg">Semua issue terselesaikan!</p>
                <p className="text-muted-foreground">Tidak ada issue terbuka di repositori ini.</p>
            </div>
        );
    }

    return (
      <TooltipProvider>
        <ul className="space-y-2">
          {issues.map(issue => (
            <li key={issue.id}>
              <Link href={issue.html_url} target="_blank" rel="noopener noreferrer">
                <div className="p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-4">
                  <Tooltip>
                    <TooltipTrigger>
                       {issue.state === 'open' ? <AlertCircle className="h-5 w-5 mt-1 text-yellow-400 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 mt-1 text-green-500 flex-shrink-0" />}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status: {issue.state}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex-grow">
                    <p className="font-semibold leading-tight">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      #{issue.number} dibuka {formatDate(issue.created_at)} oleh {issue.user.login}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
                        <AvatarFallback>{issue.user.login.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                     <TooltipContent>
                      <p>{issue.user.login}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    );
  };

  return (
    <Card className="glass-card flex flex-col h-full min-h-[500px]">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Daftar Issues</CardTitle>
        {repoName && <CardDescription>Menampilkan issues untuk <span className="font-bold text-primary">{repoName}</span></CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

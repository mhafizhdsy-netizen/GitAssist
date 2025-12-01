
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserRepos, fetchRepoIssues, createIssue, type Repo, type Issue } from '@/app/actions';
import { refineDescription } from '@/ai/flows/refine-description';
import { UploadStatusModal, type ModalStatus, type OperationStatus } from '../UploadStatusModal';
import { IssuesList } from './IssuesList';
import { AnimatePresence, motion } from 'framer-motion';

export function IssuesFeature() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isFetchingRepos, setIsFetchingRepos] = useState(true);
  const [isFetchingIssues, setIsFetchingIssues] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const [githubToken, setGithubToken] = useState<string | null>(null);
  const { toast } = useToast();

  const [modalStatus, setModalStatus] = useState<ModalStatus>('inactive');
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({ step: 'inactive', progress: 0 });
  const [resultUrl, setResultUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('github-token');
    setGithubToken(token);

    if (token) {
      fetchUserRepos(token, 1, 100)
        .then(setRepos)
        .catch(err => toast({ title: "Gagal mengambil repositori", description: err.message, variant: "destructive" }))
        .finally(() => setIsFetchingRepos(false));
    } else {
        setIsFetchingRepos(false);
    }
  }, [toast]);

  const loadIssues = useCallback((repo: Repo) => {
    if (!githubToken) return;
    setIsFetchingIssues(true);
    const [owner, repoName] = repo.full_name.split('/');
    fetchRepoIssues(githubToken, owner, repoName)
      .then(setIssues)
      .catch(err => toast({ title: "Gagal mengambil issues", description: err.message, variant: "destructive" }))
      .finally(() => setIsFetchingIssues(false));
  }, [githubToken, toast]);

  const handleRepoChange = (repoFullName: string) => {
    const repo = repos.find(r => r.full_name === repoFullName);
    if (!repo) return;
    setSelectedRepo(repo);
    setIssues([]);
    loadIssues(repo);
  };

  const handleRefineDescription = async () => {
    if (!description || description.length < 50) return;
    setIsRefining(true);
    try {
        const result = await refineDescription({ text: description, context: 'issue' });
        setDescription(result.refinedText);
        toast({ title: "Deskripsi Disempurnakan", description: "AI telah memperbarui deskripsi issue Anda.", variant: 'success' });
    } catch (error: any) {
        toast({ title: "Gagal menyempurnakan", description: error.message, variant: 'destructive'});
    } finally {
        setIsRefining(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRepo || !title || !description || !githubToken) {
      toast({ title: "Input Tidak Lengkap", description: "Harap pilih repositori, isi judul, dan deskripsi.", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    setModalStatus('processing');
    setOperationStatus({ step: 'preparing', progress: 25, text: 'Mempersiapkan issue...' });

    try {
        const [owner, repoName] = selectedRepo.full_name.split('/');
        setOperationStatus({ step: 'uploading', progress: 60, text: 'Membuat issue di GitHub...' });
        
        const result = await createIssue(githubToken, owner, repoName, title, description);
        setResultUrl(result.html_url);

        setOperationStatus({ step: 'finalizing', progress: 100, text: 'Menyelesaikan...' });
        setModalStatus('done');
        
        // Reset form and reload issues
        setTitle('');
        setDescription('');
        loadIssues(selectedRepo);

    } catch (error: any) {
        toast({ title: "Gagal Membuat Issue", description: error.message, variant: 'destructive' });
        setModalStatus('inactive');
    } finally {
        setIsCreating(false);
    }
  };

  const resetModal = () => {
    setModalStatus('inactive');
    setOperationStatus({ step: 'inactive', progress: 0 });
    setResultUrl('');
  }

  return (
    <>
      <UploadStatusModal 
        status={modalStatus}
        operationStatus={operationStatus}
        resultUrl={resultUrl}
        repoName={selectedRepo?.name || ''}
        onRestart={resetModal}
        operationType="issue"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
                <AlertCircle className="text-primary" />
                Buat Issue Baru
            </CardTitle>
            <CardDescription>Laporkan bug atau ajukan permintaan fitur ke repositori Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="repo-select-issue" className="block text-sm font-medium">Repositori</label>
              <Select onValueChange={handleRepoChange} disabled={isFetchingRepos}>
                <SelectTrigger id="repo-select-issue">
                  <Github className="h-5 w-5 text-muted-foreground mr-2" />
                  <SelectValue placeholder={isFetchingRepos ? "Memuat..." : "Pilih repositori..."} />
                </SelectTrigger>
                <SelectContent>
                  {repos.map(repo => (
                    <SelectItem key={repo.id} value={repo.full_name}>{repo.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <label htmlFor="issue-title" className="block text-sm font-medium">Judul</label>
                <Input id="issue-title" placeholder="cth: Tombol login tidak berfungsi di Firefox" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2 relative">
                <label htmlFor="issue-description" className="block text-sm font-medium">Deskripsi</label>
                <Textarea
                    id="issue-description"
                    placeholder="Jelaskan masalah secara detail, termasuk langkah-langkah untuk mereproduksi..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[150px] bg-background/50"
                />
                <AnimatePresence>
                {description.length >= 50 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-3 right-3"
                    >
                        <Button
                            size="icon"
                            className="glass-card rounded-full h-10 w-10 bg-primary/80 hover:bg-primary"
                            onClick={handleRefineDescription}
                            disabled={isRefining}
                        >
                            {isRefining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        </Button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleSubmit} disabled={isCreating || !selectedRepo || !title || !description}>
              {isCreating ? <Loader2 className="mr-2 animate-spin" /> : <AlertCircle className="mr-2" />}
              {isCreating ? "Membuat Issue..." : "Buat Issue"}
            </Button>
          </CardFooter>
        </Card>

        <IssuesList issues={issues} isLoading={isFetchingIssues} repoName={selectedRepo?.name} />
      </div>
    </>
  );
}

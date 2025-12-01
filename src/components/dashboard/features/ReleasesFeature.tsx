
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Rocket, Loader2, Sparkles, GitBranch, UploadCloud, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserRepos, fetchRepoBranches, createRelease, uploadReleaseAsset, type Repo, type Branch } from '@/app/actions';
import { refineDescription } from '@/ai/flows/refine-description';
import { useDropzone } from 'react-dropzone';
import { UploadStatusModal, type ModalStatus, type OperationStatus } from '../UploadStatusModal';
import { AnimatePresence, motion } from 'framer-motion';

export function ReleasesFeature() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const [tagName, setTagName] = useState('');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const [isFetchingRepos, setIsFetchingRepos] = useState(true);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
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

  const loadBranches = useCallback((repo: Repo) => {
    if (!githubToken) return;
    setIsFetchingBranches(true);
    const [owner, repoName] = repo.full_name.split('/');
    fetchRepoBranches(githubToken, owner, repoName)
      .then(branches => {
        setBranches(branches);
        if (branches.length > 0) {
          setSelectedBranch(repo.default_branch);
        }
      })
      .catch(err => toast({ title: "Gagal mengambil branch", description: err.message, variant: "destructive" }))
      .finally(() => setIsFetchingBranches(false));
  }, [githubToken, toast]);

  const handleRepoChange = (repoFullName: string) => {
    const repo = repos.find(r => r.full_name === repoFullName);
    if (!repo) return;
    setSelectedRepo(repo);
    setSelectedBranch('');
    setBranches([]);
    loadBranches(repo);
  };

  const handleRefineDescription = async () => {
    if (!releaseNotes || releaseNotes.length < 50) return;
    setIsRefining(true);
    try {
        const result = await refineDescription({ text: releaseNotes, context: 'release notes' });
        setReleaseNotes(result.refinedText);
        toast({ title: "Catatan Rilis Disempurnakan", description: "AI telah memperbarui catatan rilis Anda.", variant: 'success' });
    } catch (error: any) {
        toast({ title: "Gagal menyempurnakan", description: error.message, variant: 'destructive'});
    } finally {
        setIsRefining(false);
    }
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
        setAttachment(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const removeAttachment = () => setAttachment(null);

  const handleSubmit = async () => {
    if (!selectedRepo || !tagName || !releaseTitle || !githubToken || !selectedBranch) {
      toast({ title: "Input Tidak Lengkap", description: "Harap isi semua kolom yang diperlukan.", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    setModalStatus('processing');
    setOperationStatus({ step: 'preparing', progress: 10, text: 'Mempersiapkan rilis...' });

    try {
        const [owner, repoName] = selectedRepo.full_name.split('/');
        
        setOperationStatus({ step: 'preparing', progress: 30, text: 'Membuat rilis di GitHub...' });
        const release = await createRelease(githubToken, owner, repoName, {
            tag_name: tagName,
            target_commitish: selectedBranch,
            name: releaseTitle,
            body: releaseNotes,
        });
        
        let finalUrl = release.html_url;

        if (attachment && release.upload_url) {
            setOperationStatus({ step: 'uploading', progress: 70, text: `Mengunggah lampiran...` });
            const asset = await uploadReleaseAsset(githubToken, release.upload_url, attachment);
            finalUrl = asset.browser_download_url.split('/').slice(0, -1).join('/'); // URL to release page
        }

        setResultUrl(finalUrl);
        setOperationStatus({ step: 'finalizing', progress: 100, text: 'Menyelesaikan...' });
        setModalStatus('done');
        
        // Reset form
        setTagName('');
        setReleaseTitle('');
        setReleaseNotes('');
        setAttachment(null);

    } catch (error: any) {
        toast({ title: "Gagal Membuat Rilis", description: error.message, variant: 'destructive' });
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
        operationType="release"
      />
      <Card className="glass-card max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3">
            <Rocket className="text-primary" />
            Buat Rilis Baru
          </CardTitle>
          <CardDescription>Publikasikan versi baru dari perangkat lunak Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium">Repositori</label>
                <Select onValueChange={handleRepoChange} disabled={isFetchingRepos}>
                    <SelectTrigger>
                        <Github className="mr-2" />
                        <SelectValue placeholder={isFetchingRepos ? "Memuat..." : "Pilih repositori..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {repos.map(repo => <SelectItem key={repo.id} value={repo.full_name}>{repo.full_name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium">Branch Target</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isFetchingBranches || !selectedRepo}>
                    <SelectTrigger>
                        <GitBranch className="mr-2" />
                        <SelectValue placeholder={isFetchingBranches ? "Memuat..." : "Pilih branch..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map(branch => <SelectItem key={branch.name} value={branch.name}>{branch.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label htmlFor="tag-name" className="block text-sm font-medium">Nama Tag</label>
                <Input id="tag-name" placeholder="cth: v1.0.0" value={tagName} onChange={e => setTagName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <label htmlFor="release-title" className="block text-sm font-medium">Judul Rilis</label>
                <Input id="release-title" placeholder="cth: Peluncuran Versi 1.0" value={releaseTitle} onChange={e => setReleaseTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="release-notes" className="block text-sm font-medium">Catatan Rilis (Markdown didukung)</label>
            <Textarea
                id="release-notes"
                placeholder="Deskripsikan perubahan dalam rilis ini..."
                value={releaseNotes}
                onChange={e => setReleaseNotes(e.target.value)}
                className="min-h-[200px] bg-background/50"
            />
            <AnimatePresence>
            {releaseNotes.length >= 50 && (
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
          <div className="space-y-2">
            <label className="block text-sm font-medium">Lampiran Biner (Opsional)</label>
            {attachment ? (
                 <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                    <div className="flex items-center gap-3 truncate">
                        <Paperclip className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <p className="truncate text-sm">{attachment.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={removeAttachment}>
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            ) : (
                <div {...getRootProps()} className={`flex justify-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <input {...getInputProps()} />
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Seret & lepas file, atau klik untuk memilih</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isCreating || !selectedRepo || !tagName || !releaseTitle}>
            {isCreating ? <Loader2 className="mr-2 animate-spin" /> : <Rocket className="mr-2" />}
            {isCreating ? "Mempublikasikan..." : "Publikasikan Rilis"}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

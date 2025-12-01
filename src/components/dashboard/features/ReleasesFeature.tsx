'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Rocket, Loader2, Sparkles, GitBranch, UploadCloud, Paperclip, X, PlusCircle, Settings, FileArchive, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchUserRepos, fetchRepoBranches, createRelease, uploadReleaseAsset, type Repo, type Branch, type Release, fetchRepoReleases } from '@/app/actions';
import { refineDescription } from '@/ai/flows/refine-description';
import { useDropzone } from 'react-dropzone';
import { UploadStatusModal, type ModalStatus, type OperationStatus } from '../UploadStatusModal';
import { AnimatePresence, motion } from 'framer-motion';
import { ReleasesList } from './ReleasesList';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import JSZip from 'jszip';

const isZipFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.zip') || 
           fileName.endsWith('.jar') || 
           fileName.endsWith('.war') || 
           fileName.endsWith('.ear') || 
           file.type === 'application/zip' || 
           file.type === 'application/x-zip-compressed' ||
           file.type === 'application/x-zip';
}

export function ReleasesFeature() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const [tagName, setTagName] = useState('');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const [isFetchingRepos, setIsFetchingRepos] = useState(true);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingReleases, setIsFetchingReleases] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [autoExtractZip, setAutoExtractZip] = useState(true);

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

  const loadReleases = useCallback((repo: Repo) => {
    if (!githubToken) return;
    setIsFetchingReleases(true);
    const [owner, repoName] = repo.full_name.split('/');
    fetchRepoReleases(githubToken, owner, repoName)
        .then(setReleases)
        .catch(err => toast({ title: "Gagal mengambil rilis", description: err.message, variant: "destructive"}))
        .finally(() => setIsFetchingReleases(false));
  }, [githubToken, toast]);

  const handleRepoChange = (repoFullName: string) => {
    const repo = repos.find(r => r.full_name === repoFullName);
    if (!repo) return;
    setSelectedRepo(repo);
    setSelectedBranch('');
    setBranches([]);
    setReleases([]);
    loadBranches(repo);
    loadReleases(repo);
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
  
  const extractZip = useCallback(async (zipFile: File): Promise<File[]> => {
    setModalStatus('processing');
    setOperationStatus({
        step: 'preparing',
        progress: 0,
        text: `Mengekstrak ${zipFile.name}...`,
        Icon: FileArchive,
    });

    try {
        const zip = await JSZip.loadAsync(zipFile);
        const extractedFiles: File[] = [];
        const validEntries = Object.values(zip.files).filter(entry => !entry.dir && !entry.name.startsWith('__MACOSX/'));
        
        if (validEntries.length === 0) {
            toast({ title: 'ZIP Kosong', description: 'Tidak ada file yang valid ditemukan dalam arsip ZIP.', variant: 'destructive' });
            return [];
        }

        let processedFiles = 0;
        for (const zipEntry of validEntries) {
            const blob = await zipEntry.async('blob');
            // Create a new File object from blob to have proper type for attachments
            const file = new File([blob], zipEntry.name, { type: blob.type });
            extractedFiles.push(file);
            processedFiles++;
            const progress = (processedFiles / validEntries.length) * 100;
            setOperationStatus(prev => ({ ...prev, progress, text: `Mengekstrak: ${zipEntry.name}` }));
        }

        toast({ title: 'Ekstraksi Berhasil', description: `${extractedFiles.length} file berhasil diekstrak.` });
        return extractedFiles;
    } catch (error: any) {
        console.error("Kesalahan Ekstraksi ZIP:", error);
        toast({ title: 'Kesalahan Ekstraksi', description: `Gagal memproses ${zipFile.name}: ${error.message}`, variant: 'destructive' });
        return [];
    } finally {
        setModalStatus('inactive');
    }
}, [toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    let newAttachments: File[] = [];
    for (const file of acceptedFiles) {
        if (autoExtractZip && isZipFile(file)) {
            const extracted = await extractZip(file);
            newAttachments.push(...extracted);
        } else {
            newAttachments.push(file);
        }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, [autoExtractZip, extractZip]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async () => {
    if (!selectedRepo || !tagName || !releaseTitle || !githubToken || !selectedBranch) {
      toast({ title: "Input Tidak Lengkap", description: "Harap isi semua kolom yang diperlukan.", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    setModalStatus('processing');
    setOperationStatus({ step: 'preparing', progress: 10, text: 'Mempersiapkan rilis...', Icon: Rocket });

    try {
        const [owner, repoName] = selectedRepo.full_name.split('/');
        
        setOperationStatus(prev => ({ ...prev, progress: 30, text: 'Membuat rilis di GitHub...' }));
        const release = await createRelease(githubToken, owner, repoName, {
            tag_name: tagName,
            target_commitish: selectedBranch,
            name: releaseTitle,
            body: releaseNotes,
        });
        
        let finalUrl = release.html_url;

        if (attachments.length > 0 && release.upload_url) {
            const totalAttachments = attachments.length;
            for (let i = 0; i < totalAttachments; i++) {
                const attachment = attachments[i];
                const progress = 70 + (i / totalAttachments) * 20;
                setOperationStatus({ step: 'uploading', progress, text: `Mengunggah lampiran ${i + 1}/${totalAttachments}...`, Icon: UploadCloud });
                
                await uploadReleaseAsset(githubToken, release.upload_url, attachment);
            }
             finalUrl = release.html_url;
        }

        setResultUrl(finalUrl);
        setOperationStatus({ step: 'finalizing', progress: 100, text: 'Menyelesaikan...' });
        setModalStatus('done');
        
        // Reset form and reload releases
        setTagName('');
        setReleaseTitle('');
        setReleaseNotes('');
        setAttachments([]);
        loadReleases(selectedRepo);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <motion.div
            key="release-creator"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
        <Card className="glass-card">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3">
                            <Rocket className="text-primary" />
                            Buat Rilis Baru
                        </CardTitle>
                        <CardDescription>Publikasikan versi baru dari perangkat lunak Anda.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-extract-zip-release" className="flex flex-col space-y-1">
                                        <span>Ekstrak ZIP Otomatis</span>
                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                            Ekstrak file .zip secara otomatis saat diunggah.
                                        </span>
                                    </Label>
                                    <Switch
                                        id="auto-extract-zip-release"
                                        checked={autoExtractZip}
                                        onCheckedChange={setAutoExtractZip}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
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
                <div {...getRootProps({className: 'outline-none'})}>
                    <input {...getInputProps()} />
                    <div className={`flex flex-col gap-2`}>
                        {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-background/50 text-sm">
                                <div className="flex items-center gap-2 truncate">
                                    {isZipFile(file) ? <FileArchive className="h-4 w-4 text-yellow-400 flex-shrink-0" /> : <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                    <p className="truncate">{file.name}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => {e.stopPropagation(); removeAttachment(file);}}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={openFileDialog} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors border-border text-muted-foreground hover:text-foreground">
                        <PlusCircle className="h-4 w-4" />
                        Tambah File Lampiran
                    </button>
                </div>
            </div>
            </CardContent>
            <CardFooter>
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isCreating || !selectedRepo || !tagName || !releaseTitle}>
                {isCreating ? <Loader2 className="mr-2 animate-spin" /> : <Rocket className="mr-2" />}
                {isCreating ? "Mempublikasikan..." : "Publikasikan Rilis"}
            </Button>
            </CardFooter>
        </Card>
        </motion.div>
        <AnimatePresence>
        {selectedRepo && (
             <motion.div
                key="releases-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
             >
                <ReleasesList releases={releases} isLoading={isFetchingReleases} repoName={selectedRepo.name} />
             </motion.div>
        )}
        </AnimatePresence>
      </div>
    </>
  );
}

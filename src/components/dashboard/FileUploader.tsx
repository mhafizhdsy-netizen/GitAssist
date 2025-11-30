
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { UploadCloud, File, Github, Sparkles, Loader2, CheckCircle, ArrowRight, Folder, X, PlusCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateCommitMessage } from '@/ai/flows/generate-commit-message';
import { commitToRepo, fetchUserRepos } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';

// Make Buffer available globally for JSZip to use
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

type FileOrFolder = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: File | Blob;
};

type UploadStep = 'upload' | 'select-repo' | 'committing' | 'done';

type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
};

export function FileUploader() {
  const [files, setFiles] = useState<FileOrFolder[]>([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>('upload');
  
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [destinationPath, setDestinationPath] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Safely access sessionStorage only on the client side after mount
    const token = sessionStorage.getItem('github-token');
    if (token) {
      setGithubToken(token);
    }
  }, []);

  useEffect(() => {
    if (step === 'select-repo' && repos.length === 0 && githubToken) {
      setIsFetchingRepos(true);
      fetchUserRepos(githubToken)
        .then(setRepos)
        .catch(err => {
          console.error("Gagal mengambil repositori", err);
          toast({
            title: "Tidak dapat mengambil repositori",
            description: err.message || "Pastikan Anda sudah masuk dan memberikan akses ke repositori.",
            variant: "destructive"
          });
        })
        .finally(() => setIsFetchingRepos(false));
    }
  }, [step, repos.length, toast, githubToken]);

  const handleZipExtraction = useCallback(async (zipFile: File, append = false) => {
    setIsProcessing(true);
    setUploadProgress(0);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const extracted: FileOrFolder[] = [];
      const allFiles = Object.values(zip.files).filter(file => 
        !file.dir && !file.name.startsWith('__MACOSX/')
      );
      const totalFiles = allFiles.length;
      let processedFiles = 0;

      for (const zipEntry of allFiles) {
        const blob = await zipEntry.async('blob');
        const fileName = zipEntry.name.split('/').pop() || zipEntry.name;
        
        extracted.push({ name: fileName, path: zipEntry.name, type: 'file', content: blob });

        processedFiles++;
        setUploadProgress((processedFiles / totalFiles) * 100);
      }
      
      if (extracted.length === 0) {
          throw new Error("File ZIP tidak berisi file yang dapat diekstrak.");
      }
      
      setFiles(prev => append ? [...prev, ...extracted] : extracted);
      setSelectedFilePaths(prev => {
        const newSelection = new Set(prev);
        extracted.forEach(f => newSelection.add(f.path));
        return newSelection;
      });
      if (step !== 'select-repo') setStep('select-repo');
      toast({ title: 'Berhasil', description: `${extracted.length} file diekstrak dan ditambahkan.` });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Kesalahan Ekstraksi ZIP',
        description: error.message || 'Gagal mengekstrak file ZIP. Mungkin file tersebut rusak atau formatnya tidak didukung.',
        variant: 'destructive',
      });
      if (!append) resetState();
    } finally {
      setIsProcessing(false);
    }
  }, [step, toast]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const isAppending = files.length > 0;
      const zipFile = acceptedFiles.find((f) => f.type === 'application/zip' || f.name.endsWith('.zip'));

      if (zipFile) {
        if (acceptedFiles.length > 1) {
          toast({
            title: 'Kesalahan Unggah',
            description: 'Silakan unggah file ZIP secara terpisah.',
            variant: 'destructive',
          });
          return;
        }
        handleZipExtraction(zipFile, isAppending);
      } else {
        const fileList: FileOrFolder[] = acceptedFiles.map((file) => ({
          name: file.name,
          path: (file as any).webkitRelativePath || file.name,
          type: 'file',
          content: file,
        }));
        
        const currentPaths = new Set(files.map(f => f.path));
        const newUniqueFiles = fileList.filter(f => !currentPaths.has(f.path));

        setFiles(prev => [...prev, ...newUniqueFiles]);
        setSelectedFilePaths(prev => {
            const newSelection = new Set(prev);
            newUniqueFiles.forEach(f => newSelection.add(f.path));
            return newSelection;
        });

        if (step !== 'select-repo') setStep('select-repo');
      }
    },
    [files, step, toast, handleZipExtraction]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: files.length > 0, // Disable click if files are already present
    getFilesFromEvent: async (event: any) => {
        const items = event.dataTransfer ? event.dataTransfer.items : [];
        const files: File[] = [];
        if (items && items.length > 0) {
            const traverseFileTree = async (item: any, path: string = '') => {
                path = path || '';
                if (item.isFile) {
                    await new Promise<void>((resolve) => {
                        item.file((file: File & { webkitRelativePath?: string }) => {
                            if (file) {
                                Object.defineProperty(file, 'webkitRelativePath', {
                                    value: path + file.name
                                });
                                files.push(file);
                            }
                            resolve();
                        });
                    });
                } else if (item.isDirectory) {
                    const dirReader = item.createReader();
                    await new Promise<void>((resolve) => {
                        dirReader.readEntries(async (entries: any[]) => {
                            for (const entry of entries) {
                                await traverseFileTree(entry, path + item.name + "/");
                            }
                            resolve();
                        });
                    });
                }
            };
            for (const item of items) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    await traverseFileTree(entry);
                }
            }
        } else {
            const fileList = event.target.files;
            for (const file of fileList) {
                files.push(file);
            }
        }
        return files;
    }
  });

  const handleFileSelectionChange = (path: string, checked: boolean | 'indeterminate') => {
    setSelectedFilePaths(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(path);
      } else {
        newSelection.delete(path);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedFilePaths(new Set(files.map(f => f.path)));
    } else {
      setSelectedFilePaths(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFilePaths.size === 0) return;
    const newFiles = files.filter(f => !selectedFilePaths.has(f.path));
    setFiles(newFiles);
    toast({
        title: "File dihapus",
        description: `${selectedFilePaths.size} file telah dihapus.`,
    });
    setSelectedFilePaths(new Set());
    if (newFiles.length === 0) {
      resetState();
    }
  };

  const handleGenerateCommitMessage = async () => {
    const filesToConsider = files.filter(f => selectedFilePaths.has(f.path));
    if (filesToConsider.length === 0) {
      toast({ title: 'Tidak ada file dipilih', description: 'Pilih file untuk membuat pesan commit.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      // Create a simplified diff for AI context
      const diff = filesToConsider.map((f) => `A ${f.path}`).join('\n');
      const result = await generateCommitMessage({ diff });
      setCommitMessage(result.commitMessage);
    } catch (error) {
      console.error(error);
      toast({ title: 'Kesalahan AI', description: 'Gagal membuat pesan commit.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    const token = githubToken || sessionStorage.getItem('github-token');
    if (!token) {
      toast({
        title: 'Kesalahan Autentikasi',
        description: 'Token GitHub tidak ditemukan. Silakan masuk kembali.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedRepo) {
      toast({ title: 'Pemilihan repositori diperlukan', description: 'Silakan pilih repositori tujuan.', variant: 'destructive' });
      return;
    }
    if (!commitMessage) {
      toast({ title: 'Pesan commit diperlukan', variant: 'destructive' });
      return;
    }
    const filesToCommitPaths = files.filter(f => selectedFilePaths.has(f.path));
    if (filesToCommitPaths.length === 0) {
        toast({ title: 'Tidak ada file dipilih', description: 'Pilih setidaknya satu file untuk di-commit.', variant: 'destructive' });
        return;
    }
    
    setIsCommitting(true);
    setStep('committing');

    try {
      const filesToCommitContent = await Promise.all(
        filesToCommitPaths
          .filter((f) => f.type === 'file' && f.content)
          .map(async (file) => {
            const fileContent = file.content as (File | Blob);
            const content = await fileContent.arrayBuffer();
            return {
              path: file.path,
              content: Buffer.from(content).toString('base64'),
            };
          })
      );
      
      const result = await commitToRepo({
          repoUrl: selectedRepo,
          commitMessage,
          files: filesToCommitContent,
          githubToken: token,
          destinationPath
      });

      if (result.success && result.commitUrl) {
        setCommitUrl(result.commitUrl);
        setStep('done');
        toast({ title: 'Berhasil!', description: 'File telah di-commit ke repositori.' });
      } else {
        throw new Error('Commit gagal karena alasan yang tidak diketahui.');
      }
    } catch (error: any) {
        console.error(error);
        toast({ title: 'Commit Gagal', description: error.message || 'Tidak dapat melakukan commit file. Periksa URL dan izin.', variant: 'destructive' });
        setStep('select-repo');
    } finally {
        setIsCommitting(false);
    }
  };

  const resetState = () => {
    setFiles([]);
    setSelectedFilePaths(new Set());
    setUploadProgress(0);
    setStep('upload');
    setSelectedRepo('');
    setDestinationPath('');
    setCommitMessage('');
    setIsProcessing(false);
    setCommitUrl('');
    setRepos([]);
    // Token state is preserved
  };
  
  const renderUploadStep = () => (
    <div {...getRootProps({
      className: cn(`w-full flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors`, {
        'border-primary bg-primary/10': isDragActive,
        'border-border hover:border-primary/50': !isDragActive,
      })
    })}>
        <input {...getInputProps()} />
        <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold text-base">Seret & lepas file, folder, atau arsip ZIP</p>
        </div>
    </div>
  );

  const isAllSelected = files.length > 0 && selectedFilePaths.size === files.length;
  const isIndeterminate = selectedFilePaths.size > 0 && selectedFilePaths.size < files.length;

  const renderFileTree = () => (
    <div className="mt-4 rounded-lg border bg-background/50">
      <div className="flex justify-between items-center p-2 sm:p-3 border-b">
        <div className='flex items-center gap-2 sm:gap-3'>
          <Checkbox 
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Pilih semua file"
          />
          <label htmlFor="select-all" className="font-semibold text-sm cursor-pointer whitespace-nowrap">
            File ({selectedFilePaths.size}/{files.length})
          </label>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={handleDeleteSelected} disabled={selectedFilePaths.size === 0} aria-label="Hapus file yang dipilih">
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" {...getRootProps({onClick: (e) => e.preventDefault()})} aria-label="Tambah file">
              <PlusCircle className="h-5 w-5" />
              <input {...getInputProps()} style={{ display: 'none' }} />
            </Button>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto p-3">
        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.path} className="flex items-center text-sm text-muted-foreground group">
                <Checkbox
                  id={`select-${file.path}`}
                  className='mr-3'
                  checked={selectedFilePaths.has(file.path)}
                  onCheckedChange={(checked) => handleFileSelectionChange(file.path, checked)}
                />
                <File className="mr-2 h-4 w-4 flex-shrink-0" />
                <label htmlFor={`select-${file.path}`} className="truncate flex-grow cursor-pointer">{file.path}</label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-4">Tidak ada file yang diunggah.</p>
        )}
      </div>
    </div>
  );

  const renderSelectRepoStep = () => (
    <div {...getRootProps({className: "w-full flex-grow flex flex-col", onClick: (e) => e.preventDefault()})}>
        <input {...getInputProps()} />
        {renderFileTree()}
        
        <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="repo-select" className="block text-sm font-medium mb-2">
                1. Pilih Repositori
                </label>
                {isFetchingRepos ? (
                    <Skeleton className="h-11 w-full" />
                ) : (
                    <Select value={selectedRepo} onValueChange={setSelectedRepo} disabled={!githubToken}>
                        <SelectTrigger id="repo-select" className="h-11">
                            <Github className="h-5 w-5 text-muted-foreground mr-2" />
                            <SelectValue placeholder="Pilih repositori..." />
                        </SelectTrigger>
                        <SelectContent>
                            {repos.length > 0 ? repos.map(repo => (
                                <SelectItem key={repo.id} value={repo.html_url}>{repo.full_name}</SelectItem>
                            )) : (
                                <SelectItem value="none" disabled>Tidak ada repositori ditemukan atau token hilang.</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <div>
                <label htmlFor="dest-path" className="block text-sm font-medium mb-2">
                2. Folder Tujuan (Opsional)
                </label>
                <div className="relative">
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="dest-path"
                    placeholder="cth., src/assets"
                    value={destinationPath}
                    onChange={(e) => setDestinationPath(e.target.value)}
                    className="pl-10 h-11"
                />
                </div>
            </div>
            </div>
            
            <div>
            <label htmlFor="commit-msg" className="block text-sm font-medium mb-2">
                3. Pesan Commit
            </label>
            <Textarea
                id="commit-msg"
                placeholder="feat: Menambahkan fitur baru"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="font-code"
                rows={3}
            />
            <Button variant="outline" size="sm" onClick={handleGenerateCommitMessage} disabled={isGenerating} className="mt-2">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Buat dengan AI
            </Button>
            </div>
        </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-4 py-10 h-full flex flex-col items-center justify-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <p className="font-semibold text-lg">Memproses file ZIP...</p>
      <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
      <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
    </div>
  );

  const renderCommittingStep = () => (
    <div className="text-center space-y-4 py-10 h-full flex flex-col items-center justify-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <p className="font-semibold text-lg">Melakukan Commit ke Repositori</p>
      <p className="text-sm text-muted-foreground truncate max-w-sm">{selectedRepo}</p>
    </div>
  );

  const renderDoneStep = () => (
    <div className="text-center space-y-6 py-10 h-full flex flex-col items-center justify-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <div>
        <p className="font-semibold text-xl">Commit Berhasil!</p>
        <p className="text-muted-foreground mt-1">File Anda telah diunggah.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={resetState} size="lg">Unggah File Lagi</Button>
        <Button variant="outline" size="lg" asChild>
          <a href={commitUrl} target="_blank" rel="noopener noreferrer">
            Lihat Commit di GitHub <Github className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
  
  const renderContent = () => {
    if (isProcessing) return renderProcessing();
    if (isCommitting || step === 'committing') return renderCommittingStep();
    if (step === 'done') return renderDoneStep();
    if (step === 'select-repo') return renderSelectRepoStep();
    return (
      <div className="w-full h-full flex items-center justify-center">
        {renderUploadStep()}
      </div>
    );
  };

  return (
    <Card className="glass-card flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
            {step === 'upload' && !isProcessing && (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                    <UploadCloud className="h-6 w-6 text-primary" />
                </div>
            )}
            <div>
                <CardTitle className="font-headline text-2xl">Unggah ke GitHub</CardTitle>
                <CardDescription>
                    {step === 'upload' ? 'Seret & lepas file, folder, atau ZIP untuk memulai.' : 'Atur detail commit Anda.'}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col">
        {renderContent()}
      </CardContent>
      {step === 'select-repo' && (
        <CardFooter className="border-t pt-6 flex justify-between items-center">
          <Button variant="ghost" onClick={resetState}>Mulai Ulang</Button>
          <Button size="lg" onClick={handleCommit} disabled={isCommitting || isFetchingRepos || !githubToken || selectedFilePaths.size === 0}>
            {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Commit (${selectedFilePaths.size}) File`}
            {!isCommitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { UploadCloud, File, Github, Sparkles, Folder, PlusCircle, Trash2, Loader2, ArrowRight, GitBranch, X, FileArchive, Settings, Unpack } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateCommitMessage } from '@/ai/flows/generate-commit-message';
import { commitToRepo, fetchUserRepos, fetchRepoBranches, type Repo, type Branch, type UploadProgress } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { UploadStatusModal } from './UploadStatusModal';
import { Alert, AlertDescription } from '../ui/alert';
import { motion, AnimatePresence } from "framer-motion";
import { RepoPathPickerModal } from './RepoPathPickerModal';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';


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

type CommitStatus = UploadProgress;

type ModalStatus = 'inactive' | 'processing' | 'committing' | 'done';

const isZipFile = (file: FileOrFolder) => {
    return file.name.endsWith('.zip') || (file.content as File)?.type === 'application/zip';
}

export function FileUploader() {
  const [files, setFiles] = useState<FileOrFolder[]>([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(new Set());
  const [zipExtractProgress, setZipExtractProgress] = useState(0);
  
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const [destinationPath, setDestinationPath] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  const [commitMessage, setCommitMessage] = useState('');
  const [modalStatus, setModalStatus] = useState<ModalStatus>('inactive');
  const [commitStatus, setCommitStatus] = useState<CommitStatus>({ step: 'preparing', progress: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');
  const { toast } = useToast();
  const [autoExtractZip, setAutoExtractZip] = useState(true);

  useEffect(() => {
    // Safely access localStorage only on the client side
    const token = localStorage.getItem('github-token');
    if (token) {
      setGithubToken(token);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0 && githubToken && repos.length === 0) {
      setIsFetchingRepos(true);
      fetchUserRepos(githubToken, 1, 100) // Fetch up to 100 repos
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
  }, [files.length, githubToken, toast, repos.length]);

  const handleRepoChange = (repoFullName: string) => {
    const repo = repos.find(r => r.full_name === repoFullName);
    if (!repo || !githubToken) return;

    setSelectedRepo(repo);
    setSelectedBranch('');
    setBranches([]);
    setIsFetchingBranches(true);

    const [owner, repoName] = repo.full_name.split('/');
    fetchRepoBranches(githubToken, owner, repoName)
        .then(branches => {
            setBranches(branches);
            if (branches.length > 0) {
              const defaultBranch = branches.find(b => b.name === repo.default_branch);
              setSelectedBranch(defaultBranch ? defaultBranch.name : branches[0].name);
            }
        })
        .catch(err => {
            console.error("Gagal mengambil branch:", err);
            toast({
                title: "Tidak dapat mengambil branch",
                description: err.message || "Mungkin ini adalah repositori baru.",
                variant: "destructive",
            });
        })
        .finally(() => setIsFetchingBranches(false));
  };


  const handleZipExtraction = useCallback(async (zipFile: File, append = false) => {
    setModalStatus('processing');
    setZipExtractProgress(0);
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
        setZipExtractProgress((processedFiles / totalFiles) * 100);
      }
      
      if (extracted.length === 0) {
          throw new Error("File ZIP tidak berisi file yang dapat diekstrak.");
      }
      
      setFiles(prev => {
        const currentFiles = append ? prev : [];
        const existingPaths = new Set(currentFiles.map(f => f.path));
        const newUniqueFiles = extracted.filter(f => !existingPaths.has(f.path));
        return [...currentFiles, ...newUniqueFiles];
      });
      setSelectedFilePaths(prev => {
        const newSelection = new Set(prev);
        extracted.forEach(f => newSelection.add(f.path));
        return newSelection;
      });
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
      setModalStatus('inactive');
    }
  }, [toast]);

  const handleManualExtract = (zipFile: FileOrFolder) => {
    if (!zipFile.content || !(zipFile.content instanceof File)) return;

    // 1. Remove the original zip file from the list
    setFiles(prevFiles => prevFiles.filter(f => f.path !== zipFile.path));
    setSelectedFilePaths(prevSelected => {
        const newSelection = new Set(prevSelected);
        newSelection.delete(zipFile.path);
        return newSelection;
    });

    // 2. Extract its contents and append them
    handleZipExtraction(zipFile.content, true);
  };


  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const isAppending = files.length > 0;
      
      const fileList: FileOrFolder[] = acceptedFiles.map((file) => ({
        name: file.name,
        path: (file as any).webkitRelativePath || file.name,
        type: 'file',
        content: file,
      }));

      // If auto-extract is on, find ZIP files and extract them
      if (autoExtractZip) {
          const zips = fileList.filter(f => isZipFile(f));
          const nonZips = fileList.filter(f => !isZipFile(f));

          zips.forEach(zipFile => {
            if (zipFile.content instanceof File) {
                handleZipExtraction(zipFile.content, isAppending || nonZips.length > 0);
            }
          });
          
          const currentPaths = new Set(files.map(f => f.path));
          const newUniqueFiles = nonZips.filter(f => !currentPaths.has(f.path));

          setFiles(prev => [...prev, ...newUniqueFiles]);
          setSelectedFilePaths(prev => {
              const newSelection = new Set(prev);
              newUniqueFiles.forEach(f => newSelection.add(f.path));
              return newSelection;
          });

      } else {
        // If auto-extract is off, add all files as they are
        const currentPaths = new Set(files.map(f => f.path));
        const newUniqueFiles = fileList.filter(f => !currentPaths.has(f.path));

        setFiles(prev => [...prev, ...newUniqueFiles]);
        setSelectedFilePaths(prev => {
            const newSelection = new Set(prev);
            newUniqueFiles.forEach(f => newSelection.add(f.path));
            return newSelection;
        });
      }
    },
    [files, toast, handleZipExtraction, autoExtractZip]
  );

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    noClick: true, // We'll handle clicks manually
    noKeyboard: true,
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
      resetState(false);
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
    const token = githubToken;
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
    
    setModalStatus('committing');
    setCommitStatus({ step: 'preparing', progress: 0 });

    try {
      const filesToCommitContent = await Promise.all(
        filesToCommitPaths
          .filter((f) => f.type === 'file' && f.content)
          .map(async (file) => {
            const fileContent = file.content as (File | Blob);
            const textContent = await fileContent.text();
            return {
              path: file.path,
              content: textContent,
            };
          })
      );
      
      const result = await commitToRepo({
          repoUrl: selectedRepo.html_url,
          commitMessage,
          files: filesToCommitContent,
          githubToken: token,
          destinationPath,
          branchName: selectedBranch,
          onProgress: (progress) => {
            setCommitStatus(progress);
          }
      });


      if (result.success && result.commitUrl) {
        setCommitUrl(result.commitUrl);
        setCommitStatus({ step: 'finalizing', progress: 100 });
        setModalStatus('done');
        toast({ title: 'Berhasil!', description: 'File telah di-commit ke repositori.' });
      } else {
        throw new Error('Commit gagal karena alasan yang tidak diketahui.');
      }
    } catch (error: any) {
        console.error(error);
        toast({ title: 'Commit Gagal', description: error.message || 'Tidak dapat melakukan commit file. Periksa URL dan izin.', variant: 'destructive' });
        setModalStatus('inactive');
        setCommitStatus({ step: 'preparing', progress: 0 });
    }
  };
  
  const resetState = (fullReset = true) => {
    setFiles([]);
    setSelectedFilePaths(new Set());
    setZipExtractProgress(0);
    setDestinationPath('');
    setCommitMessage('');
    setModalStatus('inactive');
    setCommitUrl('');
    setBranches([]);
    setSelectedBranch('');
    setCommitStatus({ step: 'preparing', progress: 0 });
    if (fullReset) {
      setRepos([]);
      setSelectedRepo(null);
    }
  };
  
  const renderUploadStep = () => (
    <div {...getRootProps({
      className: cn(`w-full flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors`, {
        'border-primary bg-primary/10': isDragActive,
        'border-border hover:border-primary/50': !isDragActive,
      }),
    })}>
        <input {...getInputProps()} />
        <div className="text-center" onClick={(e) => { e.stopPropagation(); openFileDialog(); }}>
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold text-base">Seret & lepas file, folder, atau arsip ZIP</p>
            <p className="text-sm text-muted-foreground">atau klik untuk menelusuri</p>
        </div>
    </div>
  );

  const isAllSelected = files.length > 0 && selectedFilePaths.size === files.length;
  const isIndeterminate = files.length > 0 && selectedFilePaths.size > 0 && selectedFilePaths.size < files.length;


  const renderFileTree = () => (
    <div {...getRootProps({className: "w-full flex-grow flex flex-col", onClick: (e) => e.preventDefault()})}>
        <input {...getInputProps()} />
        <div className="mt-4 rounded-lg border bg-background/50">
        <div className="flex justify-between items-center p-2 sm:p-3 border-b">
            <div className='flex items-center gap-2 sm:gap-3'>
            <Checkbox 
                id="select-all"
                checked={isAllSelected || isIndeterminate}
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
                <Button variant="ghost" size="icon" onClick={openFileDialog} aria-label="Tambah file">
                    <PlusCircle className="h-5 w-5" />
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
                    { isZipFile(file) ? <FileArchive className="mr-2 h-4 w-4 flex-shrink-0 text-yellow-400" /> : <File className="mr-2 h-4 w-4 flex-shrink-0" /> }
                    <label htmlFor={`select-${file.path}`} className="truncate flex-grow cursor-pointer">{file.path}</label>
                    { isZipFile(file) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2" onClick={() => handleManualExtract(file)}>
                            <Unpack className="h-4 w-4" />
                        </Button>
                    )}
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-center text-xs text-muted-foreground py-4">Tidak ada file yang diunggah.</p>
            )}
        </div>
        </div>
    </div>
  );

  const renderCommitSettings = () => (
      <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
              <div>
                  <label htmlFor="repo-select" className="block text-sm font-medium mb-2">
                  1. Pilih Repositori
                  </label>
                  {isFetchingRepos ? (
                      <Skeleton className="h-11 w-full" />
                  ) : (
                      <Select value={selectedRepo?.full_name} onValueChange={handleRepoChange} disabled={!githubToken}>
                          <SelectTrigger id="repo-select" className="h-11">
                              <Github className="h-5 w-5 text-muted-foreground mr-2" />
                              <SelectValue placeholder="Pilih repositori..." />
                          </SelectTrigger>
                          <SelectContent>
                              {repos.length > 0 ? repos.map(repo => (
                                  <SelectItem key={repo.id} value={repo.full_name}>{repo.full_name}</SelectItem>
                              )) : (
                                  <SelectItem value="none" disabled>Tidak ada repositori ditemukan.</SelectItem>
                              )}
                          </SelectContent>
                      </Select>
                  )}
              </div>
              {selectedRepo && (branches.length > 0 || isFetchingBranches) && (
                    <div>
                      <label htmlFor="branch-select" className="block text-sm font-medium mb-2">
                      2. Pilih Branch
                      </label>
                      {isFetchingBranches ? (
                            <Skeleton className="h-11 w-full" />
                      ) : (
                          <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={branches.length === 0}>
                              <SelectTrigger id="branch-select" className="h-11">
                                  <GitBranch className="h-5 w-5 text-muted-foreground mr-2" />
                                  <SelectValue placeholder="Pilih branch..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {branches.map(branch => (
                                      <SelectItem key={branch.name} value={branch.name}>{branch.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      )}
                  </div>
              )}
              {selectedRepo && branches.length === 0 && !isFetchingBranches && (
                  <Alert>
                      <AlertDescription>
                          Repositori ini tampaknya kosong. Commit pertama akan dibuat pada branch <strong>{selectedBranch || 'main'}</strong>.
                      </AlertDescription>
                  </Alert>
              )}
          </div>
          <div>
              <label className="block text-sm font-medium mb-2">
                Folder Tujuan (Opsional)
              </label>
              <Button
                variant="outline"
                className="h-11 w-full justify-start text-left font-normal"
                onClick={() => setIsPickerModalOpen(true)}
                disabled={!selectedRepo}
              >
                  <Folder className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="truncate">
                    {destinationPath ? destinationPath : "Root Repositori"}
                  </span>
              </Button>
          </div>
          </div>
          
          <div>
          <label htmlFor="commit-msg" className="block text-sm font-medium mb-2">
              Pesan Commit
          </label>
          <Textarea
              id="commit-msg"
              placeholder="feat: Menambahkan fitur baru"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="font-code"
              rows={3}
          />
          <Button variant="outline" size="sm" onClick={handleGenerateCommitMessage} disabled={isGenerating || selectedFilePaths.size === 0} className="mt-2">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Buat dengan AI
          </Button>
          </div>
      </div>
  );

  return (
    <>
      <UploadStatusModal 
        status={modalStatus}
        zipExtractProgress={zipExtractProgress}
        commitStatus={commitStatus}
        commitUrl={commitUrl}
        onRestart={() => resetState(true)}
        repoName={selectedRepo?.name || ''}
      />
      {selectedRepo && githubToken && (
        <RepoPathPickerModal
            isOpen={isPickerModalOpen}
            onClose={() => setIsPickerModalOpen(false)}
            onPathSelect={(path) => {
                setDestinationPath(path);
                setIsPickerModalOpen(false);
            }}
            githubToken={githubToken}
            owner={selectedRepo.owner.login}
            repoName={selectedRepo.name}
        />
      )}
      <Card className="glass-card flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl">Unggah ke GitHub</CardTitle>
              <CardDescription>
                {files.length === 0 ? 'Seret & lepas file, folder, atau ZIP untuk memulai.' : 'Atur detail commit Anda.'}
              </CardDescription>
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
                    <Label htmlFor="auto-extract-zip" className="flex flex-col space-y-1">
                      <span>Ekstrak ZIP Otomatis</span>
                      <span className="font-normal leading-snug text-muted-foreground text-xs">
                        Ekstrak file .zip secara otomatis saat diunggah.
                      </span>
                    </Label>
                    <Switch 
                      id="auto-extract-zip" 
                      checked={autoExtractZip} 
                      onCheckedChange={setAutoExtractZip} 
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow flex flex-col">
            {files.length > 0 ? renderFileTree() :
                <div className="w-full h-full flex items-center justify-center">
                    {renderUploadStep()}
                </div>
            }

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 20, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        {renderCommitSettings()}
                    </motion.div>
                )}
            </AnimatePresence>
        </CardContent>
        {files.length > 0 && (
          <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button variant="ghost" onClick={() => resetState(true)}>Mulai Ulang</Button>
            <Button size="lg" onClick={handleCommit} disabled={modalStatus !== 'inactive' || isFetchingRepos || !githubToken || selectedFilePaths.size === 0}>
              {modalStatus === 'committing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Commit (${selectedFilePaths.size}) File`}
              {modalStatus !== 'committing' && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}

    

    
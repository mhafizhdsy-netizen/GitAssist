'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { UploadCloud, File, Github, Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateCommitMessage } from '@/ai/flows/generate-commit-message';
import { commitToRepo } from '@/app/actions';

type FileOrFolder = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: File | string;
};

type UploadStep = 'upload' | 'select-repo' | 'committing' | 'done';

export function FileUploader() {
  const [files, setFiles] = useState<FileOrFolder[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>('upload');
  const [repoUrl, setRepoUrl] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');
  const { toast } = useToast();

  const handleZipExtraction = async (zipFile: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const extracted: FileOrFolder[] = [];
      const totalFiles = Object.keys(zip.files).length;
      let processedFiles = 0;

      for (const path in zip.files) {
        if (!zip.files[path].dir) {
          const file = zip.files[path];
          const blob = await file.async('blob');
          const newFile = new File([blob], file.name, { type: blob.type });
          extracted.push({ name: file.name, path, type: 'file', content: newFile });
        }
        processedFiles++;
        setUploadProgress((processedFiles / totalFiles) * 100);
      }
      setFiles(extracted);
      setStep('select-repo');
      toast({ title: 'Success', description: `${extracted.length} files extracted from ZIP.` });
    } catch (error) {
      console.error(error);
      toast({
        title: 'ZIP Extraction Error',
        description: 'Failed to extract the ZIP file. It might be corrupted.',
        variant: 'destructive',
      });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const zipFile = acceptedFiles.find((f) => f.type === 'application/zip' || f.name.endsWith('.zip'));

      if (zipFile) {
        if (acceptedFiles.length > 1) {
          toast({
            title: 'Upload Error',
            description: 'Please upload the ZIP file by itself.',
            variant: 'destructive',
          });
          return;
        }
        handleZipExtraction(zipFile);
      } else {
        const fileList: FileOrFolder[] = acceptedFiles.map((file) => ({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          type: 'file',
          content: file,
        }));
        setFiles(fileList);
        setStep('select-repo');
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleGenerateCommitMessage = async () => {
    if (files.length === 0) {
      toast({ title: 'No files', description: 'No files to generate a commit message from.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      // Create a simplified diff for the AI
      const diff = files.map((f) => `+++ ${f.path}`).join('\n');
      const result = await generateCommitMessage({ diff });
      setCommitMessage(result.commitMessage);
    } catch (error) {
      console.error(error);
      toast({ title: 'AI Error', description: 'Failed to generate commit message.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    const githubToken = sessionStorage.getItem('github-token');
    if (!githubToken) {
      toast({
        title: 'Authentication Error',
        description: 'GitHub token not found. Please log in again.',
        variant: 'destructive',
      });
      return;
    }
    if (!repoUrl) {
      toast({ title: 'Repository URL required', variant: 'destructive' });
      return;
    }
    if (!commitMessage) {
      toast({ title: 'Commit message required', variant: 'destructive' });
      return;
    }
    
    setIsCommitting(true);
    setStep('committing');

    try {
      const filesToCommit = await Promise.all(
        files
          .filter((f) => f.type === 'file' && f.content instanceof File)
          .map(async (file) => {
            const content = await (file.content as File).arrayBuffer();
            return {
              path: file.path,
              content: Buffer.from(content).toString('base64'),
            };
          })
      );
      
      const result = await commitToRepo({
          repoUrl,
          commitMessage,
          files: filesToCommit,
          githubToken,
      });

      if (result.success && result.commitUrl) {
        setCommitUrl(result.commitUrl);
        setStep('done');
        toast({ title: 'Success!', description: 'Files committed to the repository.' });
      } else {
        throw new Error('Commit failed for an unknown reason.');
      }
    } catch (error: any) {
        console.error(error);
        toast({ title: 'Commit Failed', description: error.message || 'Could not commit files. Please check URL and permissions.', variant: 'destructive' });
        setStep('select-repo');
    } finally {
        setIsCommitting(false);
    }
  };


  const resetState = () => {
    setFiles([]);
    setUploadProgress(0);
    setStep('upload');
    setRepoUrl('');
    setCommitMessage('');
    setIsProcessing(false);
    setCommitUrl('');
  };

  const renderFileTree = () => (
    <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border bg-background/50 p-3">
      <h4 className="font-semibold mb-2 text-sm">Files to be committed ({files.length}):</h4>
      <ul className="space-y-1">
        {files.map((file) => (
          <li key={file.path} className="flex items-center text-sm text-muted-foreground">
            <File className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{file.path}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderUploadStep = () => (
    <div
      {...getRootProps()}
      className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors h-full flex flex-col justify-center items-center ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} directory="" webkitdirectory="" />
      <div className="flex flex-col items-center">
        <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="font-semibold text-xl">Drop files here</p>
        ) : (
          <p className="font-semibold text-xl">Drag & drop files, folders, or a ZIP</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">or click to select from your computer</p>
      </div>
    </div>
  );

  const renderSelectRepoStep = () => (
    <div className="space-y-6">
      {renderFileTree()}
      <div>
        <label htmlFor="repo-url" className="block text-sm font-medium mb-2">
          1. GitHub Repository URL
        </label>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="repo-url"
            placeholder="e.g., https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>
      <div>
        <label htmlFor="commit-msg" className="block text-sm font-medium mb-2">
          2. Commit Message
        </label>
        <Textarea
          id="commit-msg"
          placeholder="feat: Add new feature"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="font-code"
          rows={3}
        />
        <Button variant="outline" size="sm" onClick={handleGenerateCommitMessage} disabled={isGenerating} className="mt-2">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate with AI
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-4 py-10 h-full flex flex-col items-center justify-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <p className="font-semibold text-lg">Processing ZIP file...</p>
      <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
      <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
    </div>
  );

  const renderCommittingStep = () => (
    <div className="text-center space-y-4 py-10 h-full flex flex-col items-center justify-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <p className="font-semibold text-lg">Committing to Repository</p>
      <p className="text-sm text-muted-foreground truncate max-w-sm">{repoUrl}</p>
    </div>
  );

  const renderDoneStep = () => (
    <div className="text-center space-y-6 py-10 h-full flex flex-col items-center justify-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <div>
        <p className="font-semibold text-xl">Commit Successful!</p>
        <p className="text-muted-foreground mt-1">Your files have been uploaded.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={resetState} size="lg">Upload More Files</Button>
        <Button variant="outline" size="lg" asChild>
          <a href={commitUrl} target="_blank" rel="noopener noreferrer">
            View Commit on GitHub <Github className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );

  const stepContent = {
    'upload': renderUploadStep,
    'select-repo': renderSelectRepoStep,
    'processing': renderProcessing,
    'committing': renderCommittingStep,
    'done': renderDoneStep,
  }[isProcessing ? 'processing' : step]();

  return (
    <Card className="glass-card flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-2xl">Upload to GitHub</CardTitle>
            <CardDescription>Drag & drop files, folders, or a ZIP to get started.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">{stepContent}</CardContent>
      {step === 'select-repo' && (
        <CardFooter className="border-t pt-6 flex justify-between items-center">
          <Button variant="ghost" onClick={resetState}>Start Over</Button>
          <Button size="lg" onClick={handleCommit} disabled={isCommitting}>
            {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Commit Files'}
            {!isCommitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}


"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { UploadCloud, File, Folder, Github, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateCommitMessage } from "@/ai/flows/generate-commit-message";

type FileOrFolder = {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: File | string;
};

type UploadStep = "upload" | "select-repo" | "committing" | "done";

export function FileUploader() {
  const [files, setFiles] = useState<FileOrFolder[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>("upload");
  const [repoUrl, setRepoUrl] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
          const blob = await file.async("blob");
          const newFile = new File([blob], file.name, { type: blob.type });
          extracted.push({ name: file.name, path, type: "file", content: newFile });
        }
        processedFiles++;
        setUploadProgress((processedFiles / totalFiles) * 100);
      }
      setFiles(extracted);
      setStep("select-repo");
      toast({ title: "Success", description: "ZIP file extracted successfully." });
    } catch (error) {
      console.error(error);
      toast({
        title: "ZIP Extraction Error",
        description: "Failed to extract the ZIP file. It might be corrupted.",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const zipFile = acceptedFiles.find(f => f.type === 'application/zip' || f.name.endsWith('.zip'));

    if (zipFile) {
      if (acceptedFiles.length > 1) {
        toast({
          title: "Upload Error",
          description: "Please upload the ZIP file by itself.",
          variant: "destructive"
        });
        return;
      }
      handleZipExtraction(zipFile);
    } else {
      const fileList: FileOrFolder[] = acceptedFiles.map(file => ({
        name: file.name,
        path: file.name,
        type: 'file',
        content: file,
      }));
      setFiles(fileList);
      setStep("select-repo");
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/*': ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    },
  });

  const handleGenerateCommitMessage = async () => {
    if (files.length === 0) {
        toast({ title: "No files", description: "No files to generate a commit message from.", variant: "destructive" });
        return;
    }
    setIsGenerating(true);
    try {
        const diff = files.map(f => `+++ ${f.path}`).join('\n');
        const result = await generateCommitMessage({ diff });
        setCommitMessage(result.commitMessage);
    } catch (error) {
        console.error(error);
        toast({ title: "AI Error", description: "Failed to generate commit message.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (!repoUrl) {
      toast({ title: "Repository URL required", variant: "destructive" });
      return;
    }
    if (!commitMessage) {
        toast({ title: "Commit message required", variant: "destructive" });
        return;
    }
    setIsCommitting(true);
    setStep("committing");

    // Simulate commit process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // On real implementation, handle potential errors here.
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
        setStep("done");
        toast({ title: "Success!", description: "Files committed to the repository." });
    } else {
        toast({ title: "Commit Failed", description: "Could not commit files to the repository. Please check the URL and your permissions.", variant: "destructive" });
        setStep("select-repo"); // Go back to allow user to retry
    }

    setIsCommitting(false);
  };

  const resetState = () => {
    setFiles([]);
    setUploadProgress(0);
    setStep("upload");
    setRepoUrl("");
    setCommitMessage("");
    setIsProcessing(false);
  };

  const renderFileTree = () => (
    <div className="mt-4 max-h-60 overflow-y-auto rounded-md border p-3 bg-background/50">
        <h4 className="font-semibold mb-2">Files to be committed:</h4>
        <ul className="space-y-1">
            {files.map((file) => (
                <li key={file.path} className="flex items-center text-sm text-muted-foreground">
                    <File className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{file.path}</span>
                </li>
            ))}
        </ul>
    </div>
  )

  const renderUploadStep = () => (
    <div
      {...getRootProps()}
      className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="font-semibold text-lg">Drop the files here ...</p>
        ) : (
          <p className="font-semibold text-lg">Drag & drop files or a ZIP archive here</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">Or click to select files.</p>
      </div>
    </div>
  );

  const renderSelectRepoStep = () => (
    <div className="space-y-4">
        {renderFileTree()}
        <div>
            <label htmlFor="repo-url" className="block text-sm font-medium mb-2">GitHub Repository URL</label>
            <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    id="repo-url"
                    placeholder="e.g., https://github.com/user/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        <div>
            <label htmlFor="commit-msg" className="block text-sm font-medium mb-2">Commit Message</label>
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
        <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={resetState}>Start Over</Button>
            <Button onClick={handleCommit} disabled={isCommitting}>
                {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Commit Files
            </Button>
        </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-4 py-10">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="font-semibold text-lg">Processing ZIP file...</p>
        <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
        <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
    </div>
  );

  const renderCommittingStep = () => (
    <div className="text-center space-y-4 py-10">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="font-semibold text-lg">Committing to repository...</p>
        <p className="text-sm text-muted-foreground">{repoUrl}</p>
    </div>
  );

  const renderDoneStep = () => (
    <div className="text-center space-y-4 py-10">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <p className="font-semibold text-lg">Commit Successful!</p>
        <p className="text-sm text-muted-foreground">Your files have been uploaded to the repository.</p>
        <div className="flex gap-4 justify-center">
            <Button onClick={resetState}>Upload More Files</Button>
            <Button variant="outline" asChild>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                    View Repository <Github className="ml-2 h-4 w-4" />
                </a>
            </Button>
        </div>
    </div>
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Upload Files to GitHub</CardTitle>
        <CardDescription>
          {
            {
              "upload": "Drag and drop multiple files or a single ZIP archive to get started.",
              "select-repo": "Select a repository and write a commit message for your files.",
              "committing": "Your files are being committed. Please wait.",
              "done": "Upload and commit process completed successfully."
            }[step]
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isProcessing && renderProcessing()}
        {!isProcessing && step === 'upload' && renderUploadStep()}
        {!isProcessing && step === 'select-repo' && renderSelectRepoStep()}
        {!isProcessing && step === 'committing' && renderCommittingStep()}
        {!isProcessing && step === 'done' && renderDoneStep()}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export function FileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    // Simulate upload progress
    setUploadProgress(0);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/*': ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    }
  });

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
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
              <p className="font-semibold text-lg">Drag & drop files here, or click to select files</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">ZIP archives are automatically extracted.</p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold">Selected Files:</h4>
            <ul className="mt-2 list-disc list-inside text-muted-foreground">
              {files.map((file) => (
                <li key={file.name}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
              ))}
            </ul>
            {uploadProgress > 0 && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">{uploadProgress === 100 ? "Upload Complete!" : `Uploading... ${uploadProgress}%`}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCommitMessage } from "@/ai/flows/generate-commit-message";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clipboard, Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function AiCommitHelper() {
  const [diff, setDiff] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!diff.trim()) {
      toast({
        title: "Input diperlukan",
        description: "Silakan tempelkan diff kode untuk membuat pesan commit.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setCommitMessage("");
    try {
      const result = await generateCommitMessage({ diff });
      setCommitMessage(result.commitMessage);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal membuat pesan commit. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!commitMessage) return;
    navigator.clipboard.writeText(commitMessage);
    toast({
      title: "Disalin!",
      description: "Pesan commit disalin ke clipboard.",
    });
  };

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline text-2xl">Asisten Commit AI</CardTitle>
                <CardDescription>Buat pesan commit konvensional.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col">
        <div className="flex-grow flex flex-col">
          <label htmlFor="diff-input" className="block text-sm font-medium mb-2">Kode Diff</label>
          <Textarea
            id="diff-input"
            placeholder="Tempelkan git diff Anda di sini..."
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            className="font-code h-48 flex-grow"
          />
        </div>
        <div className="pt-4">
            {isLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                </div>
            )}
            {commitMessage && !isLoading && (
                <div className="p-4 bg-background/50 rounded-lg border relative group">
                    <pre className="whitespace-pre-wrap font-code text-sm text-foreground/90">{commitMessage}</pre>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
                        <Clipboard className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isLoading ? "Membuat..." : "Buat Pesan"}
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCommitMessage } from "@/ai/flows/generate-commit-message";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clipboard } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function AiCommitHelper() {
  const [diff, setDiff] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!diff.trim()) {
      toast({
        title: "Input required",
        description: "Please paste a code diff to generate a commit message.",
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
        description: "Failed to generate commit message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(commitMessage);
    toast({
      title: "Copied!",
      description: "Commit message copied to clipboard.",
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">AI Commit Message Helper</CardTitle>
        <CardDescription>Paste your code diff below to generate a conventional commit message.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="diff-input" className="block text-sm font-medium mb-2">Code Diff</label>
          <Textarea
            id="diff-input"
            placeholder="Paste your git diff here..."
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            className="font-code h-48"
          />
        </div>
        <div>
            <Button onClick={handleGenerate} disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Message"}
            </Button>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        )}
        {commitMessage && (
            <div className="p-4 bg-background/50 rounded-md border relative">
                <pre className="whitespace-pre-wrap font-code text-sm">{commitMessage}</pre>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleCopy}>
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

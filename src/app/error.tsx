'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-grid-pattern">
      <Card className="w-full max-w-lg glass-card shadow-2xl shadow-destructive/20 text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-headline text-destructive-foreground">Application Error</CardTitle>
          <CardDescription className="text-destructive-foreground/80">
            Oops! Something went wrong on our end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">
                A client-side exception has occurred. You can try refreshing the page or clicking the button below.
            </p>
            <Button
                onClick={
                // Attempt to recover by trying to re-render the segment
                () => reset()
                }
                size="lg"
            >
                Try Again
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

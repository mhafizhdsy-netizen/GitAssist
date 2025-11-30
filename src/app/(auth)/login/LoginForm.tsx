'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GithubAuthProvider, OAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Github, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!auth) {
      console.error('Firebase Auth is not initialized.');
      toast({
        title: 'Error',
        description: 'Authentication service is not ready. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const provider = new GithubAuthProvider();
    // Request repository access
    provider.addScope('repo');

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the OAuth access token from the credential
      const credential = GithubAuthProvider.credentialFromResult(result);
      const githubToken = credential?.accessToken;

      if (user && githubToken) {
        // Store the token in session storage for the current session
        sessionStorage.setItem('github-token', githubToken);

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.displayName || user.email}!`,
        });
        router.push('/dashboard');
      } else {
        throw new Error("Could not retrieve GitHub access token.");
      }
    } catch (error: any) {
      console.error('Error signing in with GitHub:', error);
      sessionStorage.removeItem('github-token');
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Could not authenticate with GitHub. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Button onClick={handleSignIn} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Github className="mr-2 h-5 w-5" />
        )}
        {isLoading ? 'Redirecting...' : 'Continue with GitHub'}
      </Button>
    </div>
  );
}

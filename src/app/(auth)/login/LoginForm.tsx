
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
        description: 'Layanan autentikasi belum siap. Silakan coba lagi nanti.',
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
          title: 'Login Berhasil',
          description: `Selamat datang kembali, ${user.displayName || user.email}!`,
        });
        router.push('/account');
      } else {
        throw new Error("Tidak dapat mengambil token akses GitHub.");
      }
    } catch (error: any) {
      console.error('Error saat masuk dengan GitHub:', error);
      sessionStorage.removeItem('github-token');
      toast({
        title: 'Autentikasi Gagal',
        description: error.message || 'Tidak dapat melakukan autentikasi dengan GitHub. Silakan coba lagi.',
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
        {isLoading ? 'Mengalihkan...' : 'Lanjutkan dengan GitHub'}
      </Button>
    </div>
  );
}

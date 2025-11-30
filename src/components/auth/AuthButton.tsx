'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut as serverSignOut } from '@/app/actions';
import { signOut } from 'firebase/auth';
import { ArrowRight, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

export default function AuthButton() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    // Clear the session storage on the client
    sessionStorage.removeItem('github-token');
    
    if (auth) {
        // Sign out on the client
        await signOut(auth);
    }
    
    // Call the server action to redirect
    await serverSignOut();
    
    // Refresh the router to clear client-side cache
    router.refresh();
  };

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (user) {
    const DropdownContent = () => (
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dasbor</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Akun Saya</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
    
    return (
      <div className="flex items-center gap-2">
        <div className="md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                        <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                </div>
                </DropdownMenuTrigger>
                <DropdownContent />
            </DropdownMenu>
        </div>
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownContent />
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/login">
        Mulai <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}

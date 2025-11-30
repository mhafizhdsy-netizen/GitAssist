'use server';

import {
  Auth,
  getAuth,
  signInWithPopup,
  GithubAuthProvider,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { redirect } from 'next/navigation';

import { firebaseConfig } from '@/firebase/config';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const provider = new GithubAuthProvider();

export async function signInWithGithub() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (user) {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error signing in with GitHub:', error);
    return redirect('/login?message=Could not authenticate user');
  }
}

export async function signOut() {
  await auth.signOut();
  return redirect('/');
}

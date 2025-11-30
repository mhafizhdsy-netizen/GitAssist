'use server';

import { getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { redirect } from 'next/navigation';

import { firebaseConfig } from '@/firebase/config';

function getFirebaseAuth() {
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return getAuth(app);
}

export async function signOut() {
  const auth = getFirebaseAuth();
  await auth.signOut();
  return redirect('/');
}

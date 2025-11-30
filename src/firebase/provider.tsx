'use client';

import { createContext, ReactNode, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export type FirebaseContextValue = {
  firebaseApp: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
}) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  return useContext(FirebaseContext) as FirebaseContextValue;
};

export const useFirebaseApp = () => {
  return useFirebase().firebaseApp;
};

export const useAuth = () => {
  return useFirebase().auth;
};

export const useFirestore = () => {
  return useFirebase().firestore;
};

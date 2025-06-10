// src/contexts/AuthContext.tsx
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuthService } from '@/lib/firebase'; // Renamed import
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if Firebase auth service was successfully initialized
    if (!firebaseAuthService) {
      console.warn("Firebase Auth service is not available (likely due to missing or invalid configuration). Authentication features will be disabled.");
      setLoading(false);
      return; // Do not attempt to use onAuthStateChanged if auth is null
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthService, (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous, // Ensure this is mapped
          // Add other custom fields if available or fetched
        } as UserProfile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // firebaseAuthService is stable after initial load from firebase.ts

  const signOut = async () => {
    if (!firebaseAuthService) {
      console.warn("Firebase Auth service is not available. Cannot sign out.");
      // Optionally, redirect or clear local state if needed even without Firebase
      setCurrentUser(null); 
      router.push('/');
      return;
    }
    try {
      await firebaseSignOut(firebaseAuthService);
      setCurrentUser(null);
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = {
    currentUser,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInAnonymously,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/services/firebase';
import { UserProfile } from '@/types/wiretap';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAnonymous: boolean;
  isFirebaseReady: boolean;
  error: string | null;
  signInGuest: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  linkEmailAccount: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_KEY = 'wiretap_local_guest_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Offline / Local development fallback mode
      let localProfileStr = localStorage.getItem(LOCAL_GUEST_KEY);
      let localProfile: UserProfile;
      if (!localProfileStr) {
        localProfile = {
          uid: 'guest_' + Math.random().toString(36).substring(2, 10),
          email: null,
          isAnonymous: true,
          createdAt: Date.now()
        };
        localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(localProfile));
      } else {
        localProfile = JSON.parse(localProfileStr);
      }
      setUserProfile(localProfile);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setUserProfile({
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now()
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInGuest = async () => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        const localProfile: UserProfile = {
          uid: 'guest_' + Math.random().toString(36).substring(2, 10),
          email: null,
          isAnonymous: true,
          createdAt: Date.now()
        };
        localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(localProfile));
        setUserProfile(localProfile);
        return;
      }
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest');
      throw err;
    }
  };

  const signInGoogle = async () => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
      }
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with email/password');
      throw err;
    }
  };

  const registerEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
      }
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || 'Failed to create account with email');
      throw err;
    }
  };

  const linkGoogleAccount = async () => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth || !auth.currentUser) {
        throw new Error('No active anonymous user session to link.');
      }
      await linkWithPopup(auth.currentUser, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account');
      throw err;
    }
  };

  const linkEmailAccount = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth || !auth.currentUser) {
        throw new Error('No active anonymous user session to link.');
      }
      const credential = EmailAuthProvider.credential(email, pass);
      await linkWithCredential(auth.currentUser, credential);
    } catch (err: any) {
      setError(err.message || 'Failed to link email/password account');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (auth) {
        await firebaseSignOut(auth);
      } else {
        localStorage.removeItem(LOCAL_GUEST_KEY);
        setUserProfile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAnonymous: userProfile?.isAnonymous ?? true,
        isFirebaseReady: isFirebaseConfigured,
        error,
        signInGuest,
        signInGoogle,
        signInEmail,
        registerEmail,
        linkGoogleAccount,
        linkEmailAccount,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, logout, OperationType, handleFirestoreError, onAuthStateChanged, db, signInWithEmail, signUpWithEmail } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Loader2, Play, LayoutGrid, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from './components/UI';
import { motion, AnimatePresence } from 'motion/react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  updateUser: (data: Partial<any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: any) => {
      if (currentUser) {
        // Ensure user document exists in remote DB
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || name || 'User',
              photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
              role: 'user',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [name]); // dependent on name for fresh signup

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const login = async (e: string, p: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(e, p);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in.');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (e: string, p: string, n: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const cred = await signUpWithEmail(e, p, n);
      await updateProfile(cred.user, {
        displayName: n,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.replace(/\s+/g, '')}`
      });
      // Updating state manually is not strictly needed because onAuthStateChanged handles it,
      // but forces a refresh context
      setUser({ ...cred.user, displayName: n });
    } catch (error: any) {
      setError(error.message || 'Failed to create account.');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateUser = async (data: Partial<any>) => {
    if (!user) return;
    try {
      // Sync to remote Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, data, { merge: true });

      // Update Local State
      setUser({ ...user, ...data });
    } catch (err) {
      console.error('Update user error:', err);
      throw err;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      login(email, password);
    } else {
      if (!name) {
        setError('Name is required');
        return;
      }
      register(email, password, name);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Authenticating & Syncing...</p>
      </div>
    );
  }

  // Removed inline UI blocking down the tree

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, login, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


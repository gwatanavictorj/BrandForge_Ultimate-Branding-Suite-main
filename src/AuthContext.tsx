import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, logout, OperationType, handleFirestoreError, onAuthStateChanged, db, signInWithEmail, signUpWithEmail } from './firebase';
import { doc, getDoc, setDoc } from './localDb';
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
        // Ensure user document exists in LocalDB
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
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
  }, []);

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
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (e: string, p: string, n: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await signUpWithEmail(e, p, n);
    } catch (error: any) {
      setError(error.message || 'Failed to create account.');
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
        <p className="text-slate-500 font-medium">Starting App...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 space-y-8 shadow-2xl shadow-brand-100/50 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50" />
            
            <div className="flex flex-col items-center space-y-4 relative">
              <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-200">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <div className="space-y-1 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BrandForge</h1>
                <p className="text-slate-500 text-sm">
                  {authMode === 'login' ? 'Welcome back to your creative suite' : 'Join the ultimate branding platform'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="text" 
                      placeholder="John Doe" 
                      className="pl-10 h-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base gap-3 shadow-lg shadow-brand-100 mt-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setError(null);
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
                >
                  {authMode === 'login' ? (
                    <>Don't have an account? <span className="text-brand-600 font-bold">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-brand-600 font-bold">Sign In</span></>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-6 border-t border-slate-100 flex flex-col items-center space-y-4">
              <div className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-widest leading-none">
                Local Mode Active
              </div>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Your data is saved securely in your browser's local storage.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, login, register }}>
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

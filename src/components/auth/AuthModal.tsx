import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  LogIn,
  UserCheck,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    userProfile,
    isAnonymous,
    isFirebaseReady,
    error,
    signInGuest,
    signInGoogle,
    signInEmail,
    registerEmail,
    linkGoogleAccount,
    linkEmailAccount,
    logout,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setSuccessMsg(null);
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setActionLoading(true);
    setSuccessMsg(null);

    try {
      if (isAnonymous) {
        // Upgrade existing anonymous account
        await linkEmailAccount(email, password);
        setSuccessMsg('Account upgraded successfully! Your feeds and settings are now synced.');
      } else if (mode === 'register') {
        await registerEmail(email, password);
        setSuccessMsg('Account created successfully!');
      } else {
        await signInEmail(email, password);
        setSuccessMsg('Signed in successfully!');
      }
      setTimeout(handleClose, 1200);
    } catch {
      // Error handled by AuthContext
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      if (isAnonymous && userProfile) {
        await linkGoogleAccount();
        setSuccessMsg('Account upgraded to Google! All subscriptions preserved.');
      } else {
        await signInGoogle();
        setSuccessMsg('Signed in with Google!');
      }
      setTimeout(handleClose, 1200);
    } catch {
      // Error handled by AuthContext
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Wiretap Authentication</h2>
            <p className="text-xs text-slate-400">Manage identity, sync across devices & backup state</p>
          </div>
        </div>

        {/* Firebase Configuration Notice if not set */}
        {!isFirebaseReady && (
          <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Local Guest Mode Active</p>
              <p className="text-amber-300/80 leading-relaxed">
                Wiretap is currently running with full local offline persistence. Add your Firebase credentials to `.env.local` to enable multi-device cloud synchronization.
              </p>
            </div>
          </div>
        )}

        {/* Anonymous Upgrade Banner */}
        {isAnonymous && userProfile && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Upgrade Guest Session</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Link your guest session to Google or Email to save your 16+ feeds, custom tags, and offline bookmarks permanently across all your devices.
            </p>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Active Authenticated User Info */}
        {!isAnonymous && userProfile ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center space-x-3">
              <UserCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{userProfile.email || 'Authenticated User'}</p>
                <p className="text-xs text-slate-400">UID: {userProfile.uid.slice(0, 12)}...</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors border border-slate-700"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Login / Upgrade Options */
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={actionLoading || !isFirebaseReady}
              className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-medium text-sm transition-all shadow-md active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAnonymous ? 'Link with Google Account' : 'Sign in with Google'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase tracking-wider">or email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !isFirebaseReady}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-md active:scale-[0.99]"
              >
                <span>
                  {isAnonymous
                    ? 'Upgrade Account with Email'
                    : mode === 'register'
                    ? 'Create Account'
                    : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {!isAnonymous && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
                </button>
              </div>
            )}

            {/* Guest session continue */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Continue in Guest Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

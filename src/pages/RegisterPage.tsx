import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
  onOpenDemo?: () => void;
  onStartDemo?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onOpenDemo, onStartDemo }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem('auth_last_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    code?: string;
    message: string;
    action?: 'login' | 'reset' | 'both';
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoClick = onStartDemo || onOpenDemo || (() => onNavigate('demo'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorInfo({
        message: 'Please enter your name or your business owner name.',
      });
      return;
    }

    if (password.length < 6) {
      setErrorInfo({
        code: 'weak-password',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorInfo({
        message: 'Passwords do not match. Please re-enter your password.',
      });
      return;
    }

    setLoading(true);

    try {
      try {
        sessionStorage.setItem('auth_last_email', cleanEmail);
      } catch {}

      await register(cleanEmail, password, cleanName);
      // Direct newly registered user to Onboarding to setup business profile
      onNavigate('onboarding');
    } catch (err: any) {
      console.error('Registration error:', err);
      const code = err?.code || '';
      const errMsg = err?.message || '';

      if (code === 'auth/email-already-in-use' || errMsg.includes('auth/email-already-in-use')) {
        setErrorInfo({
          code: 'email-already-in-use',
          message: `The email "${cleanEmail}" is already registered. Would you like to sign in instead or reset your password?`,
          action: 'both',
        });
      } else if (code === 'auth/invalid-email' || errMsg.includes('auth/invalid-email')) {
        setErrorInfo({
          code: 'invalid-email',
          message: 'Please enter a valid email address format (e.g. name@domain.com).',
        });
      } else if (code === 'auth/weak-password' || errMsg.includes('auth/weak-password')) {
        setErrorInfo({
          code: 'weak-password',
          message: 'Password is too weak. Please use at least 6 characters.',
        });
      } else if (code === 'auth/network-request-failed' || errMsg.includes('network-request-failed')) {
        setErrorInfo({
          code: 'network',
          message: 'Network connection issue. Please check your internet connection and retry.',
        });
      } else {
        setErrorInfo({
          message: errMsg || 'Failed to register account. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    try {
      if (email.trim()) {
        sessionStorage.setItem('auth_last_email', email.trim());
      }
    } catch {}
    onNavigate('login');
  };

  const handleGoToForgotPassword = () => {
    try {
      if (email.trim()) {
        sessionStorage.setItem('auth_last_email', email.trim());
      }
    } catch {}
    onNavigate('forgot-password');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/90 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Free Business Account
          </h2>
          <p className="text-xs text-slate-500">
            Get your custom QR codes and AI review assistant in minutes.
          </p>
        </div>

        {errorInfo && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorInfo.message}</span>
            </div>

            {errorInfo.action && (
              <div className="pt-1.5 border-t border-rose-200/80 flex items-center gap-2 flex-wrap">
                {(errorInfo.action === 'login' || errorInfo.action === 'both') && (
                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Sign In to Existing Account</span>
                  </button>
                )}
                {(errorInfo.action === 'reset' || errorInfo.action === 'both') && (
                  <button
                    type="button"
                    onClick={handleGoToForgotPassword}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100/70 text-rose-900 border border-rose-300 font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3 text-rose-600" />
                    <span>Forgot Password?</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Full Name / Owner Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Business Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@mybusiness.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password (6+ characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-50 border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Free starter tier includes 50 AI review drafts per day. No credit card required.</span>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Business Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center space-y-4">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <button
              onClick={handleGoToLogin}
              className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
            >
              Sign In
            </button>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold text-[10px]">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-amber-600" />
            <span>Explore Demo Café First</span>
          </button>
        </div>
      </div>
    </div>
  );
};

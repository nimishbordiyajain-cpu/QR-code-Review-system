import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (view: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem('auth_last_email') || '';
    } catch {
      return '';
    }
  });
  const [errorInfo, setErrorInfo] = useState<{
    code?: string;
    message: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setSuccess(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorInfo({ message: 'Please enter your registered email address.' });
      return;
    }

    setLoading(true);

    try {
      try {
        sessionStorage.setItem('auth_last_email', cleanEmail);
      } catch {}

      await resetPassword(cleanEmail);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const code = err?.code || '';
      const errMsg = err?.message || '';

      if (code === 'auth/user-not-found' || errMsg.includes('auth/user-not-found')) {
        setErrorInfo({
          code: 'user-not-found',
          message: `No account exists with "${cleanEmail}". Please check your email or contact support if you need access.`,
        });
      } else if (code === 'auth/invalid-email' || errMsg.includes('auth/invalid-email')) {
        setErrorInfo({
          code: 'invalid-email',
          message: 'Please enter a valid email address format (e.g. name@domain.com).',
        });
      } else if (code === 'auth/too-many-requests' || errMsg.includes('auth/too-many-requests')) {
        setErrorInfo({
          code: 'too-many-requests',
          message: 'Too many reset requests sent recently. Please check your inbox or wait a few minutes before trying again.',
        });
      } else if (code === 'auth/network-request-failed' || errMsg.includes('network-request-failed')) {
        setErrorInfo({
          code: 'network',
          message: 'Network connection issue. Please verify your internet connection.',
        });
      } else {
        setErrorInfo({
          message: errMsg || 'Failed to send password reset email. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/90 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            Enter your business email and we'll send you a recovery link.
          </p>
        </div>

        {errorInfo && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorInfo.message}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Reset Email Sent!</span>
            </div>
            <p className="leading-relaxed">
              We've dispatched a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder) to reset your password.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reset-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@mybusiness.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Send Reset Instructions</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

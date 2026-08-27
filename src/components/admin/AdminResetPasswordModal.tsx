import React, { useState, useEffect } from 'react';
import { X, KeyRound, Check, Copy, Loader2, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import { BusinessProfile } from '../../types';
import { adminResetPassword } from '../../services/adminService';

interface AdminResetPasswordModalProps {
  business: BusinessProfile;
  onClose: () => void;
  onSuccess: (newResetTime: string) => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  business,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const generateLink = async () => {
    if (!business.email) {
      setError('Business account does not have a recorded owner email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await adminResetPassword(business.id, business.email);
      setResetLink(res.passwordResetLink);
      onSuccess(res.lastCredentialResetAt);
    } catch (err: any) {
      console.error('Failed to generate password reset link:', err);
      setError(err?.message || 'Failed to generate password reset link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateLink();
  }, []);

  const origin = window.location.origin;
  const loginUrl = `${origin}/login`;
  const reviewPageUrl = `${origin}/review/${business.slug}`;

  const welcomeMessage = `Hi ${business.ownerName || 'there'},

Here is your updated password setup link for ${business.name} on ReviewFlow AI:

Login here: ${loginUrl}
Your email: ${business.email || ''}
Set your password here (link expires in 3 days): ${resetLink || ''}

Your public review page: ${reviewPageUrl}

Let me know if you need anything!`;

  const copyToClipboard = async (text: string, setCopiedState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2200);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Regenerate Password Setup Link</h3>
              <p className="text-xs text-slate-500">{business.name} • {business.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Generating fresh Firebase Auth security token...</p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetLink && !loading && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> New Password Setup Link (Expires in 3 days)
                  </span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetLink}
                    className="w-full text-xs font-mono bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-slate-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(resetLink, setCopiedLink)}
                    className="p-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-slate-700 shrink-0 cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Ready-to-copy client message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Updated Client Message Template
                  </label>
                  <button
                    onClick={() => copyToClipboard(welcomeMessage, setCopiedTemplate)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedTemplate
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Message
                      </>
                    )}
                  </button>
                </div>

                <pre className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-800 leading-relaxed select-all">
                  {welcomeMessage}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={generateLink}
            disabled={loading}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:opacity-50"
          >
            Generate Another Link
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

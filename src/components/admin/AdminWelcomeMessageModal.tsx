import React, { useState } from 'react';
import { Check, Copy, ExternalLink, X, MessageSquare, KeyRound, Sparkles } from 'lucide-react';
import { BusinessProfile } from '../../types';

interface AdminWelcomeMessageModalProps {
  business: BusinessProfile;
  passwordResetLink?: string;
  rawPassword?: string;
  onClose: () => void;
}

export const AdminWelcomeMessageModal: React.FC<AdminWelcomeMessageModalProps> = ({
  business,
  passwordResetLink,
  rawPassword,
  onClose,
}) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedReviewUrl, setCopiedReviewUrl] = useState(false);

  const origin = window.location.origin;
  const loginUrl = `${origin}/login`;
  const reviewPageUrl = `${origin}/review/${business.slug}`;
  const effectiveResetLink = passwordResetLink || `${origin}/forgot-password?email=${encodeURIComponent(business.email || '')}`;

  const authInstructions = rawPassword
    ? `Password: ${rawPassword}\n\n(We strongly recommend changing your password after logging in for the first time).`
    : `Set your password here (link expires in 3 days): ${effectiveResetLink}`;

  const welcomeMessage = `Hi ${business.ownerName || 'there'},

Your ReviewFlow AI account for ${business.name} is ready!

Login here: ${loginUrl}
Email: ${business.email || ''}
${authInstructions}

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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Client Onboarding & Welcome Kit</h3>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Public Review Page */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Public Review QR Page
                </span>
                <a
                  href={reviewPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={reviewPageUrl}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 select-all"
                />
                <button
                  onClick={() => copyToClipboard(reviewPageUrl, setCopiedReviewUrl)}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0"
                  title="Copy Review URL"
                >
                  {copiedReviewUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password Info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-amber-600" /> {rawPassword ? 'Initial Password' : 'Password Setup Link'}
                </span>
                {!rawPassword && <span className="text-[10px] text-amber-700 font-semibold">Valid 3 days</span>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={rawPassword || effectiveResetLink}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 select-all truncate"
                />
                <button
                  onClick={() => copyToClipboard(rawPassword || effectiveResetLink, setCopiedLink)}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0"
                  title="Copy"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Copyable Welcome Message Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Copyable WhatsApp / Email Client Welcome Message
              </label>
              <button
                onClick={() => copyToClipboard(welcomeMessage, setCopiedTemplate)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  copiedTemplate
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedTemplate ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Template
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-800 leading-relaxed select-all">
                {welcomeMessage}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

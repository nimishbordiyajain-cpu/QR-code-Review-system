import React from 'react';
import { ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

interface LegalNoticeProps {
  variant?: 'compact' | 'full';
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 bg-stone-50 border border-stone-200/90 rounded-xl p-3 text-xs text-stone-600">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-stone-800">Ethical AI Disclosure: </span>
          Review drafts are generated strictly from the customer's own selected experience and notes. The customer personally reviews, modifies if desired, and submits their review on Google.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5 text-xs text-stone-700 space-y-3 shadow-2xs">
      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
        <ShieldCheck className="w-5 h-5 text-amber-700" />
        <span>100% Google Review Policy & Consumer Privacy Compliant</span>
      </div>
      <p className="leading-relaxed text-stone-600">
        ReviewFlow AI facilitates genuine communication between businesses and their patrons. We strictly uphold Google's anti-gating and authentic review policies:
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600 pt-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Customers freely select star ratings without pre-selection or gating.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>AI review suggestions never invent facts, discounts, dishes, or staff.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Review submission is 100% manual and in the customer's direct control.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Constructive feedback is routed directly to private business management.</span>
        </li>
      </ul>
    </div>
  );
};


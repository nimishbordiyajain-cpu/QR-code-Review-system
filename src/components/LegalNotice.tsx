import React from 'react';
import { ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

interface LegalNoticeProps {
  variant?: 'compact' | 'full';
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800">Authenticity Assurance: </span>
          Review suggestions are generated strictly from the customer's selected touchpoints and direct notes. Customers personally review, edit if desired, and submit their review to Google.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-3 shadow-2xs">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <span>Google Review Policy & Anti-Gating Compliant</span>
      </div>
      <p className="leading-relaxed text-slate-600">
        ReviewFlow facilitates authentic communication between establishments and their patrons while strictly adhering to Google review guidelines and consumer protection standards:
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Customers freely select star ratings without pre-selection or gating.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Synthesized suggestions never fabricate dishes, staff, or discounts.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Review posting is strictly manual under the customer's direct control.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Private suggestions route securely to business management.</span>
        </li>
      </ul>
    </div>
  );
};

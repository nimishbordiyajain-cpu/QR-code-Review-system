import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface LegalNoticeProps {
  variant?: 'compact' | 'full';
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">Ethical AI Transparency: </span>
          Review suggestions are generated solely from the customer's own selected experience and notes. The customer personally reviews, edits, and submits their review on Google.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-2xl p-5 text-xs text-slate-700 space-y-2.5">
      <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        <span>100% Google Review Policy & Consumer Privacy Compliant</span>
      </div>
      <p className="leading-relaxed text-slate-600">
        Our platform facilitates genuine communication between businesses and their patrons. We strictly uphold Google's anti-gating policies:
      </p>
      <ul className="list-disc pl-5 space-y-1 text-slate-600">
        <li>Customers freely select their own star rating without pre-selection or gating.</li>
        <li>AI review suggestions never invent facts, discounts, dishes, or experiences.</li>
        <li>Review submission is 100% manual and in the customer's direct control.</li>
        <li>Negative, neutral, and positive feedback are treated with equal access to the review link.</li>
      </ul>
    </div>
  );
};

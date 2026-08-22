import React from 'react';
import { ShieldCheck, Lock, Eye, CheckCircle2, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (view: string) => void;
}

export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Legal & Compliance
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">Privacy Policy</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            At <strong>ReviewFlow AI</strong>, we take customer privacy and ethical AI transparency seriously. This Privacy Policy outlines how feedback and business data are processed across our platform.
          </p>

          <h3 className="text-sm font-bold text-slate-900">1. Information We Collect</h3>
          <p>
            • <strong>Customer Feedback:</strong> Star ratings, highlighted category chips, optional written comments, and optional first names submitted voluntarily by patrons via QR touchpoints.
          </p>
          <p>
            • <strong>Business Account Information:</strong> Business name, email, category, physical address, and official Google Review link provided by business owners upon registration.
          </p>

          <h3 className="text-sm font-bold text-slate-900">2. How We Use Feedback Data</h3>
          <p>
            • We process customer feedback to generate 5 optional AI review drafting suggestions using Google Gemini.
          </p>
          <p>
            • We aggregate feedback statistics to provide business owners with real-time operational insights on customer satisfaction.
          </p>
          <p>
            • We do not sell or monetize personal customer feedback data to third parties or advertising networks.
          </p>

          <h3 className="text-sm font-bold text-slate-900">3. Private Feedback Guarantee</h3>
          <p>
            Constructive notes entered into the "Private Note to Business" field are strictly restricted to the registered business dashboard and are never included in public review drafts.
          </p>

          <h3 className="text-sm font-bold text-slate-900">4. Third-Party Services</h3>
          <p>
            When customers choose to continue to Google, they are redirected to Google’s official review submission interface, which is governed by Google’s Privacy Policy and Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Terms of Service
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">Terms of Service & Ethics Charter</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-xs text-slate-600 space-y-3 leading-relaxed">
          <h3 className="text-sm font-bold text-slate-900">1. Google Review Policy & Anti-Gating Compliance</h3>
          <p>
            Businesses and patrons using ReviewFlow AI agree to uphold all applicable consumer review platform guidelines, including Google’s Prohibited and Restricted Content policies:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No Review Gating:</strong> All customers, regardless of whether their feedback is positive, neutral, or negative, must be provided with direct, unfettered access to the business's public review link.</li>
            <li><strong>No Auto-Posting:</strong> ReviewFlow AI never posts reviews on behalf of customers. The customer retains full agency, reviews the text, and manually submits on Google.</li>
            <li><strong>No Fake Reviews:</strong> The AI draft generator is bound by strict zero-hallucination rules and will never invent facts, discounts, dishes, or experiences not explicitly provided by the customer.</li>
          </ul>

          <h3 className="text-sm font-bold text-slate-900">2. Customer Responsibility</h3>
          <p>
            Patrons remain solely responsible for the authenticity and accuracy of any review text they choose to submit on third-party platforms.
          </p>

          <h3 className="text-sm font-bold text-slate-900">3. Usage Limitations</h3>
          <p>
            During the MVP Free tier, businesses are granted up to 50 AI review drafts per day. ReviewFlow AI reserves the right to rate-limit or suspend accounts that violate ethical review policies.
          </p>
        </div>
      </div>
    </div>
  );
};

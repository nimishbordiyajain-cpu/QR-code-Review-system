import React from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onStartDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onStartDemo }) => {
  return (
    <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 selection:bg-amber-700 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Col 1 & 2: Brand & Core Mission */}
          <div className="md:col-span-2 space-y-3.5 pr-4">
            <div className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display">
                ReviewFlow<span className="text-amber-500">AI</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              The ethical QR review and customer feedback infrastructure for independent cafés, restaurants, salons, and boutique hospitality. Compliant with Google Review & FTC guidelines.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900 text-[11px] text-emerald-400 font-semibold border border-stone-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Anti-Gating Compliant</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900 text-[11px] text-stone-300 font-semibold border border-stone-800">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Privacy-First Architecture</span>
              </div>
            </div>
          </div>

          {/* Col 3: Product */}
          <div>
            <h4 className="text-[11px] font-bold text-stone-200 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-stone-100 transition-colors cursor-pointer text-stone-400"
                >
                  Platform Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => (onStartDemo ? onStartDemo() : onNavigate('demo'))}
                  className="hover:text-amber-300 transition-colors text-amber-400 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Interactive Demo</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-stone-100 transition-colors cursor-pointer text-stone-400"
                >
                  Business Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-amber-300 text-stone-400 transition-colors cursor-pointer text-xs"
                >
                  System Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Review Standards */}
          <div>
            <h4 className="text-[11px] font-bold text-stone-200 uppercase tracking-wider mb-3">Ethics & Standards</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>No Review Filtering</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>No Fabricated Reviews</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Customer-Controlled Submission</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Private Operational Notes</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & System */}
          <div>
            <h4 className="text-[11px] font-bold text-stone-200 uppercase tracking-wider mb-3">Legal & Security</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-stone-100 transition-colors cursor-pointer text-stone-400"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-stone-100 transition-colors cursor-pointer text-stone-400"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <span className="text-stone-500">Tier: Professional Storefront</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} ReviewFlow AI. Engineered for authentic customer feedback and ethical review growth.</p>
          <div className="flex items-center gap-4 text-stone-400 font-mono text-[11px]">
            <span>Status: Operational</span>
            <span>•</span>
            <span>Compliance: Google ToS Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

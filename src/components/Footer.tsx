import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, CheckCircle2, Lock, ArrowUpRight, Server, Check } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onStartDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onStartDemo }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Col 1 & 2: Brand & Core Mission */}
          <div className="md:col-span-2 space-y-4 pr-4">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center text-left group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg cursor-pointer"
              aria-label="ReviewFlow Home"
            >
              <BrandLogo size="md" theme="dark" subtitle="Customer Intelligence Infrastructure" />
            </button>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Enterprise QR and tap-to-review infrastructure for independent hospitality, multi-location restaurants, salons, and medical clinics. Fully compliant with Google Review Guidelines and FTC endorsements.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-[11px] text-emerald-400 font-medium border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anti-Gating Architecture</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-[11px] text-slate-300 font-medium border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero Data Brokering</span>
              </div>
            </div>
          </div>

          {/* Col 3: Product */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider mb-3.5">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-white transition-colors cursor-pointer text-slate-400"
                >
                  System Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('enquiry')}
                  className="hover:text-blue-300 transition-colors text-white font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Enquire to Join</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => (onStartDemo ? onStartDemo() : onNavigate('demo'))}
                  className="hover:text-blue-300 transition-colors text-blue-400 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Interactive Simulator</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-white transition-colors cursor-pointer text-slate-400"
                >
                  Operator Console
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-blue-300 text-slate-400 transition-colors cursor-pointer text-xs"
                >
                  Admin Telemetry
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Review Standards */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider mb-3.5">Compliance & Policy</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Review Gating</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>User-Controlled Submissions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No Incentivized Ratings</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Encrypted Private Inboxes</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & System */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider mb-3.5">Legal & Security</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-slate-400"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-slate-400"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">SLA: 99.98% Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} ReviewFlow Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Systems Operational
            </span>
            <span>•</span>
            <span>Google Review Policy Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

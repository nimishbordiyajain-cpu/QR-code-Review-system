import React from 'react';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onStartDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onStartDemo }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-2">
            <div className="flex items-center gap-1.5 text-white font-black text-sm">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>ReviewFlow<span className="text-indigo-400">AI</span></span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Helping local businesses collect genuine customer feedback, simplify review drafting with ethical AI, and gain real-time sentiment insights.
            </p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-emerald-400 font-medium border border-slate-700">
              <ShieldCheck className="w-3 h-3" />
              <span>100% Google Policy Compliant</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Product</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => (onStartDemo ? onStartDemo() : onNavigate('demo'))}
                  className="hover:text-white transition-colors text-amber-400 font-semibold cursor-pointer"
                >
                  Try Live Demo Café
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors cursor-pointer">
                  Business Sign In
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-amber-300 text-slate-400 transition-colors cursor-pointer text-[11px]">
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Compliance & Ethics</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <span>Zero Fake Reviews Guarantee</span>
              </li>
              <li>
                <span>No Review Gating Policy</span>
              </li>
              <li>
                <span>Customer Star Ratings</span>
              </li>
              <li>
                <span>Manual Review Submission</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Legal</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <span className="text-slate-500">Free Tier (50 AI Gens/Day)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} ReviewFlow AI. Built with Google AI Studio & Gemini.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted for authentic customer experiences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

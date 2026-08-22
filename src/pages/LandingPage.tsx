import React, { useState } from 'react';
import {
  Sparkles,
  QrCode,
  Star,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Zap,
  Printer,
  Smartphone,
  BarChart3,
  HelpCircle,
  Play,
  HeartHandshake,
  Check,
  ChevronDown,
  Building2,
  Coffee,
  Scissors,
  Dumbbell,
  Stethoscope,
  Hotel,
} from 'lucide-react';
import { StarRating } from '../components/StarRating';
import { LegalNotice } from '../components/LegalNotice';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenDemo?: () => void;
  onStartDemo?: () => void;
  onOpenCustomerFlow?: (qrId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenDemo,
  onStartDemo,
  onOpenCustomerFlow,
}) => {
  const triggerDemo = onStartDemo || onOpenDemo || (() => onNavigate('demo'));
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive Live Preview State on Landing Page
  const [simRating, setSimRating] = useState<number>(5);
  const [simCategory, setSimCategory] = useState<string>('Staff: Very friendly');
  const [simStep, setSimStep] = useState<number>(1);

  const sampleCategories = [
    'Food Quality: Excellent',
    'Staff: Very friendly',
    'Service Speed: Fast',
    'Cleanliness: Spotless',
    'Ambience: Cozy & quiet',
  ];

  const faqs = [
    {
      q: 'Does this violate Google Review policies against review gating?',
      a: 'No! ReviewFlow strictly complies with Google’s policies. We NEVER selectively hide the review link from customers with lower ratings, we NEVER automatically assign 5-star ratings, and we NEVER post reviews automatically. All customers have equal access to the business’s Google link, and all reviews are personally submitted by the customer.',
    },
    {
      q: 'Will the AI generate fake reviews or invent details?',
      a: 'Never. Our system prompt strictly forbids inventing facts, food items, discounts, or experiences. The AI only assists in articulating the exact observations and rating the customer provided.',
    },
    {
      q: 'How do customers post the review to Google?',
      a: 'When the customer clicks "Continue to Google", the selected review draft is automatically copied to their clipboard and the business\'s official Google Review link opens in a new tab. The customer simply pastes and clicks Submit on Google.',
    },
    {
      q: 'Can I print QR codes for tables, counters, or takeaway bags?',
      a: 'Yes! Our built-in QR generator creates printable table tent cards, counter standees, and downloadable PNGs with one click. No paid QR generator subscription needed.',
    },
    {
      q: 'Is there any cost to get started?',
      a: 'ReviewFlow AI is free to start, with up to 50 AI review drafts per day per business on our standard plan.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ethical AI Review & Customer Feedback SaaS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Turn Customer Experiences Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600">
                Authentic Reviews
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
              Collect genuine customer feedback, make sharing experiences effortless with 5 customer-controlled AI draft styles, and understand what your customers love.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="hero-get-started-btn"
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-try-demo-btn"
                onClick={triggerDemo}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5"
              >
                <Play className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Try Demo Café</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Fake Reviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Customer Controlled Rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Free Starter Plan</span>
              </div>
            </div>
          </div>

          {/* Interactive Flow Visualizer Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Live Interactive Simulation
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  How the Customer Experience Works
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setSimStep(1)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    simStep === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  1. Rating
                </button>
                <button
                  onClick={() => setSimStep(2)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    simStep === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  2. Highlights
                </button>
                <button
                  onClick={() => setSimStep(3)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    simStep === 3 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  3. 5 AI Drafts
                </button>
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left simulation controls */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Step 1: Choose Star Rating
                  </label>
                  <StarRating
                    rating={simRating}
                    onRatingChange={(r) => {
                      setSimRating(r);
                      if (simStep === 1) setSimStep(2);
                    }}
                    interactive={true}
                    size="lg"
                    showLabel={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Step 2: Tap What Stood Out
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sampleCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSimCategory(cat);
                          setSimStep(3);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          simCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right simulation output */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">AI Generated Draft Example</span>
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    Friendly & Natural
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    {Array.from({ length: simRating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <span className="ml-1 text-slate-300 font-semibold">{simRating}.0 / 5.0</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-normal italic">
                    "{simRating >= 4
                      ? `Had a wonderful visit! The ${simCategory.split(':')[0].toLowerCase()} was top notch and everything was smooth and enjoyable. Highly recommended!`
                      : `Visited recently. While some aspects were okay, ${simCategory.toLowerCase()} could be improved. Sharing constructive feedback for the team.`}"
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] text-slate-400">Customer copies & pastes to Google</span>
                  <button
                    onClick={triggerDemo}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                  >
                    Test Full Demo Flow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suitable for all small businesses */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Engineered For Every Type of Local Business
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: <Coffee className="w-5 h-5 text-amber-600" />, label: 'Cafés & Bakeries' },
              { icon: <Building2 className="w-5 h-5 text-blue-600" />, label: 'Restaurants' },
              { icon: <Scissors className="w-5 h-5 text-rose-600" />, label: 'Salons & Spas' },
              { icon: <Hotel className="w-5 h-5 text-indigo-600" />, label: 'Boutique Hotels' },
              { icon: <Dumbbell className="w-5 h-5 text-emerald-600" />, label: 'Gyms & Fitness' },
              { icon: <Stethoscope className="w-5 h-5 text-cyan-600" />, label: 'Clinics & Care' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs mb-2">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How ReviewFlow AI Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From table QR scan to authentic Google review in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Create Your Profile & QR',
              desc: 'Add your business name, connect your Google Review link, and print customized table standees or counter QR cards in seconds.',
              icon: <QrCode className="w-6 h-6 text-indigo-600" />,
            },
            {
              step: '02',
              title: 'Customer Scans QR',
              desc: 'Patrons scan using their phone camera without downloading any app or creating an account. Mobile-first and blazing fast.',
              icon: <Smartphone className="w-6 h-6 text-blue-600" />,
            },
            {
              step: '03',
              title: 'Selects Experience & Rating',
              desc: 'Customer freely picks their 1-5 star rating and taps intuitive chips for food, staff, speed, ambience, and private notes.',
              icon: <Star className="w-6 h-6 text-amber-500" />,
            },
            {
              step: '04',
              title: 'AI Drafts & Google Review',
              desc: 'AI instantly crafts 5 distinct review drafts. Customer picks one, edits if desired, copies, and manually submits on Google.',
              icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative hover:shadow-md transition-shadow"
            >
              <div className="text-4xl font-black text-slate-100 absolute top-4 right-5 select-none">
                {card.step}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Benefits & Dashboard Overview */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800">
                Actionable Customer Insights
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Understand What Your Customers Love In Real Time
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Beyond collecting reviews, ReviewFlow provides a live business intelligence hub. Spot recurring staff compliments, catch service bottlenecks early, and receive AI-synthesized trend summaries.
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  'Real-time rating distribution and category sentiment breakdown',
                  'Location-specific QR tracking (Counter vs. Tables vs. Patio)',
                  'Private customer feedback channel for constructive suggestions',
                  'AI Business Insights summarizing operational strengths and growth tips',
                ].map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  id="benefits-demo-btn"
                  onClick={onOpenDemo}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore Demo Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mock Dashboard Preview Card */}
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Demo Café Analytics</div>
                  <div className="text-lg font-bold text-white">Artisan Roast & Bakery</div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.8 / 5.0 Avg</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xl font-bold text-white">349</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">QR Scans</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xl font-bold text-indigo-400">205</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Feedbacks</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xl font-bold text-emerald-400">142</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Google Clicks</div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Business Insight Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Customers overwhelmingly praise the friendly staff (81 selections) and fresh pastries. Service speed during 8-9 AM rush remains the primary improvement point."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Got Questions? We've Got Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <LegalNotice variant="full" />
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Turn Customer Visits into Authentic 5-Star Reviews?
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto">
            Set up your business profile in under 2 minutes. Free starter tier available.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="cta-get-started-btn"
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-slate-100 font-extrabold text-sm shadow-md transition-all"
            >
              Create Free Business Account
            </button>
            <button
              id="cta-demo-btn"
              onClick={triggerDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-800/80 hover:bg-indigo-900 text-white font-bold text-sm border border-indigo-400/40 transition-all"
            >
              Try Demo Without Registration
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

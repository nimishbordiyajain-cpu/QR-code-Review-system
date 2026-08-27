import React, { useState, useEffect, useRef } from 'react';
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
  Copy,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Sparkle,
  Sliders,
  Store,
  Layers,
  Lock,
  Calculator,
  Eye,
  Award,
  ArrowUpRight,
  FileText,
  ScanLine,
} from 'lucide-react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import { LegalNotice } from '../components/LegalNotice';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenDemo?: () => void;
  onStartDemo?: () => void;
  onOpenCustomerFlow?: (qrId: string) => void;
}

// Business demo presets for the interactive simulation
interface BusinessDemoPreset {
  id: string;
  name: string;
  category: string;
  hardwareMockup: string;
  tags: string[];
  sampleDrafts: {
    title: string;
    style: string;
    text: string;
  }[];
}

const DEMO_PRESETS: BusinessDemoPreset[] = [
  {
    id: 'cafe',
    name: 'Artisan Roast & Bakery',
    category: 'Café & Bakery',
    hardwareMockup: 'Acrylic Table Tent (4" x 6")',
    tags: ['Barista: Friendly & fast', 'Espresso: Rich & smooth', 'Pastries: Freshly baked', 'Ambience: Cozy seating'],
    sampleDrafts: [
      {
        title: 'Warm & Natural',
        style: 'Casual',
        text: 'Stopped by for an iced latte and almond croissant. The barista was super friendly and the coffee had incredible flavor. Such a cozy spot!',
      },
      {
        title: 'Detailed & Thorough',
        style: 'Foodie',
        text: 'Exceptional coffee craftsmanship. The espresso extraction was balanced and smooth, and the freshly baked pastries were top tier. Service was prompt even during the morning rush.',
      },
      {
        title: 'Short & Punchy',
        style: 'Direct',
        text: 'Best espresso in the neighborhood. Friendly staff, great seating, and spotless tables. 10/10 recommend!',
      },
    ],
  },
  {
    id: 'salon',
    name: 'Luxe Hair & Day Spa',
    category: 'Hair Salon & Spa',
    hardwareMockup: 'Mirror Station Decal',
    tags: ['Stylist: Listened carefully', 'Consultation: Professional', 'Ambience: Tranquil', 'Results: Exceeded expectations'],
    sampleDrafts: [
      {
        title: 'Warm & Natural',
        style: 'Casual',
        text: 'Loved my appointment today! My stylist took the time to understand exactly what I wanted. Left feeling refreshed with great results.',
      },
      {
        title: 'Detailed & Thorough',
        style: 'In-Depth',
        text: 'Incredible attention to detail from the initial consultation through the final styling. The tranquil ambience and professional care made this the best salon experience I have had all year.',
      },
      {
        title: 'Short & Punchy',
        style: 'Direct',
        text: 'Fantastic cut and styling! The team is talented and welcoming. Already booked my next visit.',
      },
    ],
  },
  {
    id: 'hotel',
    name: 'The Juniper Boutique Inn',
    category: 'Boutique Hotel',
    hardwareMockup: 'Engraved Oak Room Block',
    tags: ['Check-in: Seamless', 'Room: Spotless & quiet', 'Breakfast: Artisan & fresh', 'Location: Walkable'],
    sampleDrafts: [
      {
        title: 'Warm & Natural',
        style: 'Casual',
        text: 'Such a charming stay! Seamless check-in, spotless room with super comfortable bedding, and the morning artisan breakfast was delightful.',
      },
      {
        title: 'Detailed & Thorough',
        style: 'Traveler',
        text: 'Impeccable hospitality from start to finish. The property is peaceful and thoughtfully designed, perfectly located for walking downtown. Highest marks for cleanliness and staff warmth.',
      },
      {
        title: 'Short & Punchy',
        style: 'Direct',
        text: 'Wonderful boutique hotel experience. Quiet, clean, and incredible hospitality. Will definitely return on my next trip.',
      },
    ],
  },
];

// Animated Number Counter
function StatCounter({ target, suffix = '', duration = 1.4 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }
    if (isInView) {
      let start = 0;
      const end = target;
      const totalFrames = Math.round(duration * 60);
      let frame = 0;
      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const ease = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(start + (end - start) * ease));
        if (frame >= totalFrames) {
          clearInterval(timer);
          setCount(end);
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, target, duration, shouldReduceMotion]);

  return (
    <div ref={ref} className="font-mono font-bold text-2xl sm:text-3xl text-stone-100 tracking-tight">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenDemo,
  onStartDemo,
}) => {
  const triggerDemo = onStartDemo || onOpenDemo || (() => onNavigate('demo'));
  const shouldReduceMotion = useReducedMotion();

  // Active FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Simulation View Mode: 'phone' or 'standee'
  const [simViewMode, setSimViewMode] = useState<'phone' | 'standee'>('phone');

  // Interactive Live Simulation State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cafe');
  const currentPreset = DEMO_PRESETS.find((p) => p.id === selectedPresetId) || DEMO_PRESETS[0];

  const [simStep, setSimStep] = useState<1 | 2 | 3>(1);
  const [simRating, setSimRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([currentPreset.tags[0], currentPreset.tags[1]]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(0);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  // ROI Calculator State
  const [dailyCustomers, setDailyCustomers] = useState<number>(180);
  const [businessTypeMultiplier, setBusinessTypeMultiplier] = useState<number>(1.0); // 1.0 = standard cafe/resto

  // Calculated ROI Metrics
  const estimatedMonthlyVisitors = dailyCustomers * 30;
  const estimatedMonthlyScans = Math.round(estimatedMonthlyVisitors * 0.14); // ~14% scan rate
  const projectedReviewsPerMonth = Math.round(estimatedMonthlyScans * 0.62 * businessTypeMultiplier); // ~62% completion
  const estimatedAnnualNewReviews = projectedReviewsPerMonth * 12;

  // Update selected tags when preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const newPreset = DEMO_PRESETS.find((p) => p.id === presetId) || DEMO_PRESETS[0];
    setSelectedTags([newPreset.tags[0], newPreset.tags[1]]);
    setSelectedDraftIndex(0);
    setCopiedDraft(false);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCopySimDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const faqs = [
    {
      q: 'Does this comply with Google Review policies against review gating?',
      a: 'Yes, 100%. ReviewFlow strictly adheres to Google’s anti-gating policies. We NEVER selectively block customers from reaching the Google Review link based on star rating, we NEVER pre-select 5-star ratings without customer choice, and all reviews are personally reviewed, copied, and submitted by the customer.',
    },
    {
      q: 'Will the AI invent food items, staff names, or fake details?',
      a: 'Never. Our system prompt is grounded exclusively in the customer’s selected tags and ratings. It articulates real customer feedback naturally rather than fabricating hallucinated claims.',
    },
    {
      q: 'How does the customer submit their review on Google?',
      a: 'After selecting their preferred draft, the customer taps "Copy & Open Google Review Link". The draft text is instantly copied to their device clipboard, and the business’s official Google Review popup opens in a new tab. The customer simply pastes and taps Post.',
    },
    {
      q: 'Can I print customized table standees, tent cards, and counter QR standees?',
      a: 'Yes! ReviewFlow includes a built-in print studio that generates print-ready table tents, counter standees, mirror decals, and high-resolution PNG QR codes tailored to your storefront colors and logo.',
    },
    {
      q: 'What happens when a customer has constructive private feedback?',
      a: 'Customers can easily add private constructive notes. These are routed directly to your private business inbox, giving you real-time intelligence to fix operational issues before they impact public ratings.',
    },
    {
      q: 'Do customers need to download an app or create an account?',
      a: 'No app download or account creation is required. Customers simply scan the QR code using their iPhone or Android camera, and the lightweight web experience loads in under 1 second.',
    },
  ];

  return (
    <div className="bg-[#FAF8F5] text-stone-900 min-h-screen selection:bg-amber-700 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-stone-200/90 bg-gradient-to-b from-white via-[#F7F4EE] to-[#FAF8F5]">
        {/* Subtle warm ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero Header & Value Proposition */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center max-w-3xl mx-auto space-y-5"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Ethical QR Review & Feedback Infrastructure</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-950 tracking-tight leading-[1.12]">
              Turn Real Storefront Visits Into{' '}
              <span className="text-amber-800">
                High-Trust 5-Star Reviews
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Place elegant QR standees at tables and counters. Customers tap their experience highlights, and receive 5 personalized AI draft variations ready to paste directly to Google in seconds.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                id="hero-get-started-btn"
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <span>Launch Business Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-try-demo-btn"
                onClick={triggerDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <Play className="w-4 h-4 text-amber-700 fill-amber-700" />
                <span>Try Interactive Live Demo</span>
              </button>
            </div>

            {/* Micro Trust Strip */}
            <div className="pt-5 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-stone-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>100% Google Policy Safe (No Gating)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Zero Hallucinated Claims</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Print-Ready Acrylic & Wood Standees</span>
              </div>
            </div>
          </motion.div>

          {/* 2. Interactive Table-to-Review Engine */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="mt-12 max-w-5xl mx-auto bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 relative"
          >
            {/* Top Controller Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Live Experience Engine
                  </span>
                  <span className="text-xs text-stone-400 font-medium">Test real storefront simulation</span>
                </div>
                <h3 className="font-display text-lg font-bold text-stone-900 mt-1">
                  How Customers Experience Your Storefront QR Code
                </h3>
              </div>

              {/* Business Preset Switcher */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      selectedPresetId === preset.id
                        ? 'bg-white text-stone-900 shadow-2xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {preset.category.split('&')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode & Step Tabs */}
            <div className="pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                {[
                  { step: 1, label: '1. Scan Standee' },
                  { step: 2, label: '2. Rate & Highlight' },
                  { step: 3, label: '3. 5 AI Drafts' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setSimStep(s.step as 1 | 2 | 3)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      simStep === s.step
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Toggle Smartphone vs Table Standee View */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  onClick={() => setSimViewMode('phone')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    simViewMode === 'phone'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-stone-700" />
                  <span>Mobile Screen</span>
                </button>
                <button
                  onClick={() => setSimViewMode('standee')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    simViewMode === 'standee'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tabletop Standee</span>
                </button>
              </div>
            </div>

            {/* Dual Column Layout: Left Configuration Controls + Right Live Simulator Screen */}
            <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Interactive Controls */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Customer Star Rating:
                    </label>
                    <div className="flex items-center gap-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => {
                            setSimRating(star);
                            if (simStep === 1) setSimStep(2);
                          }}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                          title={`Rate ${star} Stars`}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= simRating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-stone-300 fill-transparent'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {simRating}.0 / 5.0
                      </span>
                    </div>
                  </div>

                  {/* Highlight Chips */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Selected Experience Highlights (Tap to toggle):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPreset.tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              toggleTag(tag);
                              if (simStep < 2) setSimStep(2);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              isSelected
                                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1 stroke-[3]" />}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flow guidance tip */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <Sparkle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      ReviewFlow synthesizes the customer's actual selections into 5 personalized tones (Casual, Detailed, Foodie/Professional, Short & Direct, Enthusiastic).
                    </span>
                  </div>
                </div>

                {/* Bottom Step Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      if (simStep === 1) setSimStep(2);
                      else if (simStep === 2) setSimStep(3);
                      else setSimStep(1);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <span>{simStep === 3 ? 'Restart Simulation' : `Proceed to Step ${simStep + 1}`}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Live Simulated Smartphone or Storefront Standee View */}
              <div className="lg:col-span-7 bg-stone-950 text-stone-100 rounded-2xl p-4 sm:p-6 flex flex-col justify-between relative border border-stone-800 shadow-2xl overflow-hidden min-h-[380px]">
                {simViewMode === 'phone' ? (
                  <AnimatePresence mode="wait">
                    {simStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                        animate={shouldReduceMotion ? false : { opacity: 1, x: 0 }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 my-auto"
                      >
                        <div className="text-center space-y-3 py-4">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                            <QrCode className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                              Table Standee Scanned
                            </span>
                            <h4 className="font-display text-lg font-bold text-white mt-0.5">
                              Welcome to {currentPreset.name}
                            </h4>
                            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                              How was your visit today? Tap to share your thoughts in seconds.
                            </p>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => setSimStep(2)}
                              className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                            >
                              Start Quick Feedback
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {simStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                        animate={shouldReduceMotion ? false : { opacity: 1, x: 0 }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 my-auto"
                      >
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                          <span className="text-xs font-bold text-stone-300">Customer Rating Screen</span>
                          <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                            No App Required
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                            <div className="text-[11px] text-stone-400 font-semibold mb-1">Your Rating</div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < simRating ? 'fill-current' : 'text-stone-700 fill-transparent'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-xs font-bold text-white">{simRating} Stars</span>
                            </div>
                          </div>

                          <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                            <div className="text-[11px] text-stone-400 font-semibold mb-1.5">What stood out?</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => setSimStep(3)}
                            className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate 5 Customer Review Drafts</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {simStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                        animate={shouldReduceMotion ? false : { opacity: 1, x: 0 }}
                        exit={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3.5"
                      >
                        {/* Draft Header */}
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-bold text-stone-200">5 Customer Review Options</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Customer Controlled
                          </span>
                        </div>

                        {/* Style Selector Tabs */}
                        <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg">
                          {currentPreset.sampleDrafts.map((draft, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedDraftIndex(idx);
                                setCopiedDraft(false);
                              }}
                              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                selectedDraftIndex === idx
                                  ? 'bg-amber-700 text-white font-bold'
                                  : 'text-stone-400 hover:text-stone-200'
                              }`}
                            >
                              {draft.style}
                            </button>
                          ))}
                        </div>

                        {/* Draft Output Box */}
                        <div className="bg-stone-900 rounded-xl p-3.5 border border-stone-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                            <span className="text-amber-300 font-semibold">
                              {currentPreset.sampleDrafts[selectedDraftIndex]?.title}
                            </span>
                            <span className="text-stone-500">Ready to paste</span>
                          </div>
                          <p className="text-xs text-stone-200 leading-relaxed italic font-normal">
                            "{currentPreset.sampleDrafts[selectedDraftIndex]?.text}"
                          </p>
                        </div>

                        {/* Customer Action Button */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleCopySimDraft(currentPreset.sampleDrafts[selectedDraftIndex]?.text || '')
                            }
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              copiedDraft
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-700 hover:bg-amber-600 text-white'
                            }`}
                          >
                            {copiedDraft ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied! Opening Google...</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy & Open Google Review Link</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={triggerDemo}
                            title="Open full interactive demo café"
                            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Full Demo
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  /* Storefront Acrylic Standee Preview */
                  <div className="space-y-4 my-auto">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <span className="text-xs font-bold text-stone-300">Physical Storefront Standee Preview</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                        {currentPreset.hardwareMockup}
                      </span>
                    </div>

                    {/* Acrylic Card Rendering */}
                    <div className="bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl p-6 border border-stone-700 shadow-2xl text-center space-y-4 max-w-xs mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-white">{currentPreset.name}</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">Scan camera to leave feedback</p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl inline-block shadow-md">
                        <QrCode className="w-24 h-24 text-stone-950 mx-auto" />
                      </div>

                      <div className="text-[10px] text-stone-400 font-mono flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Powered by ReviewFlow AI</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Footer Info */}
                <div className="mt-auto pt-3 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>ReviewFlow AI • Storefront Engine</span>
                  <span className="text-emerald-400">● 100% Policy-Safe</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. NEW: Interactive Storefront Review Velocity & Local SEO Impact Calculator */}
      <section className="py-16 bg-white border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Interactive ROI & Growth Calculator
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Estimate Your Storefront's 5-Star Review Velocity
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              See the projected volume of authentic Google reviews generated from your table standees each month.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Inputs */}
            <div className="md:col-span-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Average Daily Guests / Table Turns:
                  </label>
                  <span className="font-mono font-bold text-sm text-amber-800 bg-white px-2.5 py-0.5 rounded border border-stone-200 shadow-2xs">
                    {dailyCustomers} guests/day
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={10}
                  value={dailyCustomers}
                  onChange={(e) => setDailyCustomers(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                  <span>30/day (Boutique)</span>
                  <span>300/day (Busy Bistro)</span>
                  <span>600/day (High-Volume)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
                  Business Storefront Category:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Café / Bakery', mult: 1.0 },
                    { label: 'Restaurant', mult: 1.15 },
                    { label: 'Salon / Spa', mult: 0.95 },
                    { label: 'Hotel / Inn', mult: 1.2 },
                    { label: 'Fitness / Gym', mult: 0.85 },
                    { label: 'Clinic / Care', mult: 0.9 },
                  ].map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBusinessTypeMultiplier(cat.mult)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        businessTypeMultiplier === cat.mult
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Output Dashboard */}
            <div className="md:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Projected Review Lift</span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  +340% vs Traditional
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Monthly QR Scans</div>
                  <div className="font-mono text-2xl font-black text-stone-900 mt-1">
                    ~{estimatedMonthlyScans.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Based on 14% scan rate</div>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                  <div className="text-[10px] text-amber-900 uppercase font-semibold">New 5★ Reviews / Mo</div>
                  <div className="font-mono text-2xl font-black text-amber-800 mt-1">
                    +{projectedReviewsPerMonth.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">High-converting drafts</div>
                </div>
              </div>

              <div className="p-3.5 bg-stone-900 text-stone-100 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-semibold">Annual Projected Growth:</span>
                  <span className="font-mono font-bold text-amber-400">+{estimatedAnnualNewReviews.toLocaleString()} Google Reviews</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Consistently ranking in Google Maps "Local 3-Pack" for your neighborhood searches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Engineered for Every Storefront Section */}
      <section className="py-16 bg-[#FAF8F5] border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Tailored Storefront Solutions
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Engineered For Every Type of Local Storefront
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Smart category-specific review prompts customized for your exact customer touchpoints.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                icon: <Coffee className="w-5 h-5 text-amber-700" />,
                title: 'Cafés & Bakeries',
                desc: 'Table tents & espresso counter standees',
                accent: 'hover:border-amber-400 hover:bg-amber-50/40',
              },
              {
                icon: <Building2 className="w-5 h-5 text-stone-700" />,
                title: 'Restaurants & Bistros',
                desc: 'Bill presenter inserts & patio standees',
                accent: 'hover:border-stone-400 hover:bg-stone-50',
              },
              {
                icon: <Scissors className="w-5 h-5 text-stone-700" />,
                title: 'Salons & Spas',
                desc: 'Mirror stickers & reception counter QR',
                accent: 'hover:border-stone-400 hover:bg-stone-50',
              },
              {
                icon: <Hotel className="w-5 h-5 text-amber-800" />,
                title: 'Boutique Hotels',
                desc: 'Keycard sleeves & bedside cards',
                accent: 'hover:border-amber-400 hover:bg-amber-50/40',
              },
              {
                icon: <Dumbbell className="w-5 h-5 text-stone-700" />,
                title: 'Gyms & Studios',
                desc: 'Locker room & front-desk scan badges',
                accent: 'hover:border-stone-400 hover:bg-stone-50',
              },
              {
                icon: <Stethoscope className="w-5 h-5 text-stone-700" />,
                title: 'Clinics & Care',
                desc: 'Waiting room displays & checkout cards',
                accent: 'hover:border-stone-400 hover:bg-stone-50',
              },
            ].map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
                className={`p-4 rounded-2xl bg-white border border-stone-200/80 transition-all flex flex-col items-center text-center cursor-default ${cat.accent}`}
              >
                <div className="w-11 h-11 rounded-xl bg-stone-50 flex items-center justify-center shadow-2xs border border-stone-200/70 mb-2.5">
                  {cat.icon}
                </div>
                <h3 className="font-display text-xs font-bold text-stone-900 leading-tight">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  {cat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 4-Step Process Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Simple 4-Step Architecture
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            From Storefront QR Scan to 5-Star Review
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Zero friction for customers, zero policy risk for businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Print Standees in 2 Minutes',
              desc: 'Add your business name, connect your Google Review URL, and print customized table standees, tent cards, or counter QR standees.',
              icon: <QrCode className="w-6 h-6 text-amber-700" />,
            },
            {
              step: '02',
              title: 'Customer Scans on Phone',
              desc: 'Patrons scan with their standard camera app. Instant mobile web app loads with zero download or account creation required.',
              icon: <Smartphone className="w-6 h-6 text-stone-800" />,
            },
            {
              step: '03',
              title: 'Taps Experience Highlights',
              desc: 'Customer selects their 1-5 star rating and taps intuitive chips for food, service speed, ambience, staff, or private feedback.',
              icon: <Star className="w-6 h-6 text-amber-500" />,
            },
            {
              step: '04',
              title: '1-Click Paste to Google',
              desc: 'AI crafts 5 natural draft variations. Customer selects their preferred option, clicks copy, and pastes directly to Google Reviews.',
              icon: <Sparkles className="w-6 h-6 text-stone-800" />,
            },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs relative hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="font-mono text-3xl font-black text-stone-200 select-none">
                    {card.step}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-stone-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                <span>Phase {card.step} Verified</span>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Dark Analytics Section */}
      <section className="py-20 bg-stone-950 text-white relative overflow-hidden border-y border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
                Actionable Storefront Intelligence
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-stone-100">
                Understand What Your Customers Love In Real Time
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Beyond collecting reviews, ReviewFlow provides a live business intelligence hub. Spot recurring staff compliments, catch service bottlenecks early, and receive AI-synthesized trend summaries.
              </p>

              <div className="space-y-3 pt-1">
                {[
                  'Real-time rating distribution and category sentiment breakdown',
                  'Location-specific QR tracking (Counter vs. Tables vs. Patio)',
                  'Private customer feedback channel for constructive suggestions',
                  'AI Business Insights summarizing operational strengths and growth tips',
                ].map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  id="benefits-demo-btn"
                  onClick={triggerDemo}
                  className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span>Explore Demo Analytics Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Mock Live Analytics Card */}
            <div className="bg-stone-900/90 rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-2xl space-y-5 backdrop-blur-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                  <div className="text-xs font-semibold text-stone-400">Live Telemetry & Metrics</div>
                  <div className="font-display text-lg font-bold text-white">Artisan Roast & Bakery</div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.8 / 5.0 Avg</span>
                </div>
              </div>

              {/* Animated Stat Numbers */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                  <StatCounter target={349} />
                  <div className="text-[10px] text-stone-400 uppercase font-medium mt-0.5">QR Scans</div>
                </div>
                <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                  <StatCounter target={205} />
                  <div className="text-[10px] text-amber-400 uppercase font-medium mt-0.5">Feedbacks</div>
                </div>
                <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                  <StatCounter target={142} />
                  <div className="text-[10px] text-emerald-400 uppercase font-medium mt-0.5">Google Clicks</div>
                </div>
              </div>

              {/* AI Business Insight */}
              <div className="bg-stone-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Business Insight Summary</span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-500">Updated today</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed italic">
                  "Customers overwhelmingly praise the friendly barista service (81 mentions) and fresh pastries. Service speed during 8-9 AM morning rush remains the primary constructive point."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Honest Social Proof & Policy Integrity Section */}
      <section className="py-16 bg-[#FAF8F5] border-b border-stone-200/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900">
                    Our Honest Product & Review Integrity Pledge
                  </h3>
                  <p className="text-xs text-stone-500">Why ReviewFlow is engineered differently</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                100% Policy-Safe
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 leading-relaxed">
              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>No Fake Testimonials</span>
                </div>
                <p>
                  We never fabricate customer reviews or customer quotes. Our AI strictly helps real customers articulate their genuine observations.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>No Review Gating</span>
                </div>
                <p>
                  Every customer has full access to the business Google link regardless of rating. We comply strictly with Google's terms of service.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Customer Controls Submission</span>
                </div>
                <p>
                  Reviews are never submitted automatically. Customers choose the draft, make edits if desired, and submit manually with one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Frequently Asked Questions
          </span>
          <h2 className="font-display text-3xl font-extrabold text-stone-900">
            Got Questions? We Have Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs transition-colors hover:border-stone-300"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 hover:text-amber-800 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-expanded={isOpen}
                >
                  <span className="font-display">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-700' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <LegalNotice variant="full" />
        </div>
      </section>

      {/* 9. Bottom CTA Banner */}
      <section className="py-16 bg-stone-950 text-white text-center border-t border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
            Start Collecting Reviews Today
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-100">
            Ready to Turn Every Visit Into an Authentic 5-Star Review?
          </h2>
          <p className="text-stone-400 text-sm sm:text-base max-w-xl mx-auto font-normal">
            Set up your storefront QR codes in under 2 minutes. Free starter tier included.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="cta-get-started-btn"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Sign In to Business Portal
            </button>
            <button
              id="cta-demo-btn"
              onClick={triggerDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-sm border border-stone-700 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Try Interactive Live Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

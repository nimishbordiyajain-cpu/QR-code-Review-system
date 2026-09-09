import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  AlertCircle,
  Loader2,
  ChevronRight,
  HelpCircle,
  Store,
  Layers,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../components/BrandLogo';
import { BusinessCategory } from '../types';
import { submitPublicEnquiry } from '../services/enquiryService';

interface EnquiryPageProps {
  onNavigate: (view: string) => void;
  onStartDemo?: () => void;
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'Restaurant',
  'Café',
  'Salon',
  'Beauty',
  'Hotel',
  'Homestay',
  'Boutique',
  'Retail',
  'Grocery',
  'Gym',
  'Clinic',
  'Service Business',
  'Other',
];

const REFERRAL_SOURCES = [
  'Google / Search Engine',
  'Saw a ReviewFlow QR Standee in a Store',
  'Colleague / Industry Referral',
  'Social Media (LinkedIn, Twitter, Instagram)',
  'Direct Outreach / Email',
  'Event / Conference',
  'Other',
];

export const EnquiryPage: React.FC<EnquiryPageProps> = ({ onNavigate, onStartDemo }) => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Restaurant');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState('Google / Search Engine');
  const [honeypot, setHoneypot] = useState(''); // Anti-spam hidden trap

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!businessName.trim()) {
      setError('Please provide your business name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid work or business email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setError('Please provide a valid contact phone number.');
      return;
    }

    setLoading(true);
    try {
      await submitPublicEnquiry({
        name: fullName.trim(),
        businessName: businessName.trim(),
        category,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        message: message.trim() || undefined,
        source: source || undefined,
        website_hp: honeypot,
      });

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      setError(err?.message || 'Failed to submit your enquiry. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen selection:bg-blue-600 selection:text-white py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={() => onNavigate('landing')}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Request Storefront Access</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Context, Value Proposition & Trust Standards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Direct Client Onboarding</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Request ReviewFlow for Your Storefront
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                To guarantee white-glove setup and custom branding for every location, we personally provision each business portal, configure your custom QR templates, and verify Google Review URL compliance.
              </p>
            </div>

            {/* Structured Process Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                How Onboarding Works
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-[11px]">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Submit Your Details</div>
                    <div className="text-slate-500 mt-0.5 leading-relaxed">
                      Share your business category, location, and specific review goals.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-[11px]">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Personal Provisioning & Review</div>
                    <div className="text-slate-500 mt-0.5 leading-relaxed">
                      We configure your dedicated slug, QR code vectors, and operator dashboard.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-[11px]">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Secure Welcome Package</div>
                    <div className="text-slate-500 mt-0.5 leading-relaxed">
                      Receive your login credentials, hardware print kit, and ready-to-use QR codes within 24 hours.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Guarantee */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 border border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Anti-Gating & FTC Compliant</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ReviewFlow operates strictly within Google Maps Review policies and the FTC Endorsement Guides. Every customer submission is authentic, user-controlled, and verified.
              </p>
            </div>

            {/* Interactive Simulator Shortcut */}
            <div className="pt-2">
              <button
                onClick={() => (onStartDemo ? onStartDemo() : onNavigate('demo'))}
                className="w-full p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center justify-between transition-colors shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Want to test the workflow first?</div>
                    <div className="text-[11px] text-slate-500">Launch the interactive storefront simulator</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Right Column: Form or Success Confirmation */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="enquiry-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                >
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      Express Interest & Request Setup
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Complete this brief form. We typically respond and provision accounts within 24 business hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    {/* Error Box */}
                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Honeypot Trap for Spam Bots (Hidden from human users) */}
                    <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                      <label htmlFor="website_hp">Leave this empty</label>
                      <input
                        type="text"
                        id="website_hp"
                        name="website_hp"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Jenkins"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors"
                        />
                      </div>

                      {/* Business Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Business Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Saffron Bistro & Lounge"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Business Category */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Primary Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors cursor-pointer"
                        >
                          {BUSINESS_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City / Location */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          City / Market Area <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chicago, IL or Bengaluru"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Work / Owner Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Work Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="sarah@saffronbistro.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Contact Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +1 (555) 234-5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors"
                        />
                      </div>
                    </div>

                    {/* How did you hear about us */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        How did you hear about ReviewFlow? <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors cursor-pointer"
                      >
                        {REFERRAL_SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message / Requirements */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tell us about your business & goals <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. We operate 2 dining locations and want to deploy acrylic QR table tents to increase our Google 5-star review velocity."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-blue-600 transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Enquiry...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Enquiry & Request Access</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] text-slate-400">
                        We respect your privacy. No spam, ever. Your information is strictly used to provision and configure your business account.
                      </p>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* Success Confirmation State */
                <motion.div
                  key="enquiry-success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-display text-2xl font-black text-slate-900 tracking-tight">
                      Enquiry Received!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thank you, <strong className="text-slate-900">{fullName}</strong>. We have registered the onboarding request for <strong className="text-slate-900">{businessName}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3 max-w-md mx-auto">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Next Steps</span>
                    </div>
                    <ul className="space-y-2 text-slate-600 leading-relaxed text-[11px]">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span>Our administrator will review your business profile and generate your dedicated QR review portal.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span>We will email a customized login activation link and onboarding guide to <strong className="text-slate-800">{email}</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                        <span>You can expect a response within 24 business hours.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => onNavigate('landing')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Return to Homepage
                    </button>
                    <button
                      onClick={() => (onStartDemo ? onStartDemo() : onNavigate('demo'))}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Try Interactive Simulator</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

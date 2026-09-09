import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessCategory } from '../types';
import { createBusinessProfile } from '../services/businessService';
import { createQRCode } from '../services/qrService';
import { GoogleReviewUrlInput } from '../components/GoogleReviewUrlInput';
import { normalizeGoogleReviewUrl } from '../utils/googleReviewUrlHelper';
import {
  Store,
  MapPin,
  Phone,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES: BusinessCategory[] = [
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

interface OnboardingPageProps {
  onNavigate: (view: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { currentUser, setCurrentBusiness } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Café');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    const cleanGoogleUrl = normalizeGoogleReviewUrl(googleReviewUrl.trim());
    if (!cleanGoogleUrl) {
      setError('Google Review URL is required to connect your customer review flow. You can use the helper or sample link.');
      return;
    }

    if (!currentUser) {
      setError('User session expired. Please sign in again.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Business Profile
      const business = await createBusinessProfile({
        ownerId: currentUser.uid,
        name: businessName.trim(),
        ...(ownerName.trim() ? { ownerName: ownerName.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        category,
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
        googleReviewUrl: cleanGoogleUrl,
      });

      setCurrentBusiness(business);

      // 2. Generate initial default QR Code
      await createQRCode(
        business.id,
        business.slug,
        'Main Counter / Front Desk',
        'Billing Counter Stand'
      );

      // Navigate to dashboard
      onNavigate('dashboard');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      setError(err?.message || 'Failed to complete business setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Step 1 of 1 • Business Profile Setup
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Set Up Your Business Profile
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Connect your Google review link and customize your business details so customers can start sharing experiences.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="onboarding-business-name-input"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Artisan Roast & Bakery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="onboarding-owner-name-input"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Category *
                </label>
                <select
                  id="onboarding-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="onboarding-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Physical Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="onboarding-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brief Business Description
                </label>
                <textarea
                  id="onboarding-description-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Specialty coffee shop with freshly baked pastries, artisanal sourdough, and fast Wi-Fi."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Google Review URL Box */}
            <div className="pt-2">
              <GoogleReviewUrlInput
                value={googleReviewUrl}
                onChange={setGoogleReviewUrl}
                businessName={businessName}
                address={address}
                idPrefix="onboarding"
                required={true}
              />
            </div>

            {/* Submit */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                id="onboarding-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Finish Setup & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, BusinessCategory } from '../types';
import { updateBusinessProfile } from '../services/businessService';
import { DEMO_BUSINESS } from '../utils/demoData';
import {
  Settings,
  Store,
  MapPin,
  Phone,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  ShieldCheck,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
}

const CATEGORIES: BusinessCategory[] = [
  'Restaurant',
  'Café',
  'Salon',
  'Beauty',
  'Hotel',
  'Boutique',
  'Retail',
  'Grocery',
  'Gym',
  'Clinic',
  'Service Business',
  'Other',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDemoMode = false }) => {
  const { currentBusiness, refreshBusiness } = useAuth();
  const business: BusinessProfile = isDemoMode ? DEMO_BUSINESS : (currentBusiness || DEMO_BUSINESS);

  const [name, setName] = useState(business.name || '');
  const [ownerName, setOwnerName] = useState(business.ownerName || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [category, setCategory] = useState<BusinessCategory>(business.category || 'Café');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(business.googleReviewUrl || '');
  const [description, setDescription] = useState(business.description || '');
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestGoogleUrl = () => {
    if (googleReviewUrl && googleReviewUrl.startsWith('http')) {
      window.open(googleReviewUrl, '_blank');
    } else {
      setError('Please enter a valid URL starting with https://');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (isDemoMode) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      return;
    }

    if (!business.id) return;
    setSaving(true);

    try {
      await updateBusinessProfile(business.id, {
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        category,
        googleReviewUrl: googleReviewUrl.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });

      await refreshBusiness();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Settings update error:', err);
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] pb-12">
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Business Profile Settings
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Update your business details, branding, and Google review link.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {savedSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name *
                </label>
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-business-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-owner-name-input"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Category
                </label>
                <select
                  id="settings-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Description
                </label>
                <textarea
                  id="settings-description-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Logo Image URL (Optional)
                </label>
                <input
                  id="settings-logo-url-input"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Google Review Link Section */}
            <div className="pt-3 border-t border-slate-100">
              <div className="bg-indigo-50/40 border border-indigo-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Google Review URL *</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="settings-google-url-input"
                    type="url"
                    required
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="settings-test-google-url-btn"
                    type="button"
                    onClick={handleTestGoogleUrl}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-1 shrink-0"
                  >
                    <span>Test URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                id="settings-save-btn"
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

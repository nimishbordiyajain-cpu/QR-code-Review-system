import React, { useState } from 'react';
import { X, Building2, User, CreditCard, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { BusinessCategory, BusinessProfile } from '../../types';
import { adminCreateBusiness } from '../../services/adminService';

export interface AdminCreateBusinessInitialData {
  name?: string;
  category?: BusinessCategory;
  address?: string;
  phone?: string;
  ownerName?: string;
  email?: string;
  ownerPhone?: string;
  adminNotes?: string;
}

interface AdminCreateBusinessModalProps {
  onClose: () => void;
  onSuccess: (business: BusinessProfile, passwordResetLink?: string) => void;
  initialData?: AdminCreateBusinessInitialData;
}

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

export const AdminCreateBusinessModal: React.FC<AdminCreateBusinessModalProps> = ({
  onClose,
  onSuccess,
  initialData,
}) => {
  const defaultRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<BusinessCategory>(initialData?.category || 'Restaurant');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [ownerName, setOwnerName] = useState(initialData?.ownerName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [ownerPhone, setOwnerPhone] = useState(initialData?.ownerPhone || initialData?.phone || '');

  const [planName, setPlanName] = useState('Standard');
  const [dailyGenerationLimit, setDailyGenerationLimit] = useState(50);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly' | 'one-time'>('monthly');
  const [amountPaid, setAmountPaid] = useState<number>(1999);
  const [currency, setCurrency] = useState('INR');
  const [nextRenewalDate, setNextRenewalDate] = useState(defaultRenewalDate);
  const [adminNotes, setAdminNotes] = useState(initialData?.adminNotes || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    if (!ownerName.trim()) {
      setError('Owner name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('A valid owner login email is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminCreateBusiness({
        name: name.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        category,
        address: address.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        logoUrl: logoUrl.trim(),
        dailyGenerationLimit: Number(dailyGenerationLimit) || 50,
        planName: planName.trim(),
        billingCycle,
        amountPaid: Number(amountPaid) || 0,
        currency: currency.trim().toUpperCase() || 'INR',
        nextRenewalDate,
        adminNotes: adminNotes.trim(),
      });

      if (res.business) {
        onSuccess(res.business, res.passwordResetLink);
      }
    } catch (err: any) {
      console.error('Failed to provision client business:', err);
      if (err?.message?.includes('expected pattern') || err?.message?.includes('InvalidCharacterError')) {
        setError('Your admin session token is corrupted. Please log out and log back in to continue.');
      } else {
        setError(err?.message || 'Failed to provision client business.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Provision New Client Business</h3>
              <p className="text-xs text-slate-500">
                Creates owner credentials, public review QR portal, and billing record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Business Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Business Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Bistro & Cafe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Physical Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 MG Road, Indiranagar, Bengaluru"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Maps Review URL
                </label>
                <input
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner & Auth Credentials */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>2. Owner & Login Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Login Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="owner@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98450 11223"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Plan, Billing & Admin Control */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                <span>3. Subscription Plan & Admin Controls</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin Only (Owner Cannot Edit)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier</label>
                <input
                  type="text"
                  placeholder="e.g. Standard, Growth, Enterprise"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-Time / Lifetime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily AI Limit (drafts/day)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={dailyGenerationLimit}
                  onChange={(e) => setDailyGenerationLimit(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Renewal Date
                </label>
                <input
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Notes (Internal arrangement, offline payment ref, reminders)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Paid cash on onboarding; renewed for 6 months discount; customized prompt preferences."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Provisioning Account...
                </>
              ) : (
                'Create & Generate Welcome Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

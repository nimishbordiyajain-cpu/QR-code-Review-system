import React, { useState } from 'react';
import { X, Building2, User, CreditCard, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { BusinessCategory, BusinessProfile } from '../../types';
import { adminUpdateBusiness } from '../../services/adminService';

interface AdminEditBusinessModalProps {
  business: BusinessProfile;
  onClose: () => void;
  onSuccess: () => void;
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

export const AdminEditBusinessModal: React.FC<AdminEditBusinessModalProps> = ({
  business,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(business.name || '');
  const [category, setCategory] = useState<BusinessCategory>(business.category || 'Restaurant');
  const [address, setAddress] = useState(business.address || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(business.googleReviewUrl || '');
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');
  const [status, setStatus] = useState<'active' | 'disabled'>(business.status || 'active');

  const [ownerName, setOwnerName] = useState(business.ownerName || '');
  const [email, setEmail] = useState(business.email || '');
  const [ownerPhone, setOwnerPhone] = useState(business.ownerPhone || '');

  const [planName, setPlanName] = useState(business.planName || 'Standard');
  const [dailyGenerationLimit, setDailyGenerationLimit] = useState<number | string>(
    business.dailyGenerationLimit || 50
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly' | 'one-time'>(
    business.billingCycle || 'monthly'
  );
  const [amountPaid, setAmountPaid] = useState<number | string>(business.amountPaid ?? 1999);
  const [currency, setCurrency] = useState(business.currency || 'INR');
  const [nextRenewalDate, setNextRenewalDate] = useState(
    business.nextRenewalDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [adminNotes, setAdminNotes] = useState(business.adminNotes || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }

    setLoading(true);
    try {
      await adminUpdateBusiness({
        businessId: business.id,
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
        status,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to update business configuration:', err);
      if (err?.message?.includes('expected pattern') || err?.message?.includes('InvalidCharacterError')) {
        setError('Your admin session token is corrupted. Please log out and log back in to continue.');
      } else {
        setError(err?.message || 'Failed to update business configuration.');
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
              <h3 className="text-base font-bold text-slate-900">Edit Business & Subscription</h3>
              <p className="text-xs text-slate-500">ID: {business.id} • Slug: {business.slug}</p>
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

          {/* Section 1: Business Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Business Details</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Status:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <option value="active">Active (QR & App Live)</option>
                  <option value="disabled">Disabled (Portal Suspended)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
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
                  Physical Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Phone
                </label>
                <input
                  type="text"
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
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner Contact */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>2. Owner Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Phone
                </label>
                <input
                  type="text"
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
                <ShieldCheck className="w-3 h-3" /> Admin Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier</label>
                <input
                  type="text"
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
                  max="5000"
                  value={dailyGenerationLimit}
                  onChange={(e) => setDailyGenerationLimit(e.target.value)}
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
                  onChange={(e) => setAmountPaid(e.target.value)}
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
                Admin Notes (Internal arrangement, notes, offline payment ref)
              </label>
              <textarea
                rows={2}
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

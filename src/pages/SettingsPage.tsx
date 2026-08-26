import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, BusinessCategory } from '../types';
import { updateBusinessProfile } from '../services/businessService';
import { DEMO_BUSINESS } from '../utils/demoData';
import { GoogleReviewUrlInput } from '../components/GoogleReviewUrlInput';
import { normalizeGoogleReviewUrl } from '../utils/googleReviewUrlHelper';
import { auth } from '../lib/firebase';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import {
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  KeyRound,
  Mail,
  Shield,
  Lock,
} from 'lucide-react';

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

interface SettingsPageProps {
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
}

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

  // Account Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (isDemoMode) {
      setPwdSuccess('Demo mode: Password update simulated.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    if (!auth.currentUser) {
      setPwdError('No authenticated user session found.');
      return;
    }

    setPwdLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPwdSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setPwdError('For security, updating your password requires a recent login. Please sign out and sign back in before changing your password, or use the reset email button below.');
      } else {
        setPwdError(err?.message || 'Failed to update password.');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setPwdSuccess(null);
    setPwdError(null);
    setResetEmailSent(false);

    const userEmail = auth.currentUser?.email || business.email;
    if (!userEmail) {
      setPwdError('No email address associated with this account.');
      return;
    }

    setPwdLoading(true);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      setResetEmailSent(true);
      setPwdSuccess(`Password reset email sent to ${userEmail}. Follow the link in your inbox to set a new password.`);
    } catch (err: any) {
      setPwdError(err?.message || 'Failed to send reset email.');
    } finally {
      setPwdLoading(false);
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
      const cleanGoogleUrl = normalizeGoogleReviewUrl(googleReviewUrl.trim());

      await updateBusinessProfile(business.id, {
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        category,
        googleReviewUrl: cleanGoogleUrl,
        description: description.trim(),
        logoUrl: logoUrl.trim(),
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
            <div className="pt-2">
              <GoogleReviewUrlInput
                value={googleReviewUrl}
                onChange={setGoogleReviewUrl}
                businessName={name}
                address={address}
                idPrefix="settings"
                required={true}
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                id="settings-save-btn"
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Account Security & Password Management Card */}
        <div className="mt-6 bg-white rounded-xl p-5 sm:p-7 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Account Security & Credentials</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Manage your account login credentials and reset password options.
          </p>

          {pwdSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Form for direct password update */}
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Change Password</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="settings-confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                id="settings-update-pwd-btn"
                type="submit"
                disabled={pwdLoading || !newPassword || !confirmPassword}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{pwdLoading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>

            {/* Password Reset Email Option */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Send Password Reset Email</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Need to set or change your password via email? Click below to send a secure password reset link to <strong className="text-slate-700">{auth.currentUser?.email || business.email || 'your registered email'}</strong>.
                </p>
              </div>
              <button
                id="settings-send-reset-btn"
                type="button"
                onClick={handleSendResetEmail}
                disabled={pwdLoading}
                className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{resetEmailSent ? 'Send Another Reset Email' : 'Email Password Reset Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

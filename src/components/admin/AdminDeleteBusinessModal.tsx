import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { BusinessProfile } from '../../types';
import { adminDeleteBusiness } from '../../services/adminService';

interface AdminDeleteBusinessModalProps {
  business: BusinessProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminDeleteBusinessModal: React.FC<AdminDeleteBusinessModalProps> = ({
  business,
  onClose,
  onSuccess,
}) => {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatched = confirmName.trim().toLowerCase() === business.name.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched) {
      setError(`Typed name must match "${business.name}" exactly.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminDeleteBusiness(business.id, confirmName.trim());
      onSuccess();
    } catch (err: any) {
      console.error('Failed to delete business:', err);
      if (err?.message?.includes('expected pattern') || err?.message?.includes('InvalidCharacterError')) { setError('Your admin session token is corrupted. Please log out and log back in to continue.'); } else { setError(err?.message || 'Failed to permanently delete business account.'); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">Deprovision & Delete Business</h3>
              <p className="text-xs text-rose-700">Permanent destruction of client data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDelete} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2.5 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Warning: This action is irreversible and permanent.</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Executing this deprovisioning request will immediately delete the following:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Firebase Auth account for <strong>{business.email}</strong></li>
              <li>Business Profile & slug <strong>/review/{business.slug}</strong></li>
              <li>All registered physical/digital QR code documents</li>
              <li>All historical private customer feedback submissions</li>
              <li>Review-redirect click telemetry records & daily AI draft metrics</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              To confirm, type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{business.name}</span> below:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={business.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:bg-white focus:outline-rose-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
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
              disabled={!isMatched || loading}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting All Data...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Deprovision & Delete Forever
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

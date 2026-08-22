import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, QRCodeItem } from '../types';
import { getQRCodesByBusiness, createQRCode, toggleQRStatus } from '../services/qrService';
import { DEMO_BUSINESS, DEMO_QR_CODES } from '../utils/demoData';
import { QRModal } from '../components/QRModal';
import {
  QrCode,
  Plus,
  Printer,
  Download,
  Eye,
  Copy,
  Check,
  Power,
  Sparkles,
  MapPin,
  Smartphone,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Store,
} from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/qrHelper';

interface QRManagementPageProps {
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
  onOpenCustomerFlow?: (qrId: string) => void;
}

export const QRManagementPage: React.FC<QRManagementPageProps> = ({
  onNavigate,
  isDemoMode = false,
  onOpenCustomerFlow,
}) => {
  const { currentUser, currentBusiness } = useAuth();
  const business: BusinessProfile = isDemoMode ? DEMO_BUSINESS : (currentBusiness || DEMO_BUSINESS);

  const [qrList, setQrList] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRForModal, setSelectedQRForModal] = useState<QRCodeItem | null>(null);

  // New QR Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQRName, setNewQRName] = useState('');
  const [newQRLocation, setNewQRLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadQRs = async () => {
    setLoading(true);
    if (isDemoMode) {
      setQrList(DEMO_QR_CODES);
      setLoading(false);
      return;
    }

    if (business && business.id) {
      try {
        const items = await getQRCodesByBusiness(business.id);
        setQrList(items);
      } catch (err) {
        console.error('Error fetching QR codes:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQRs();
  }, [business.id, isDemoMode]);

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQRName.trim()) {
      setCreateError('Please enter a QR name.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      if (isDemoMode) {
        const newDemoQR: QRCodeItem = {
          id: `qr_demo_${Date.now()}`,
          businessId: business.id,
          businessSlug: business.slug,
          name: newQRName.trim(),
          location: newQRLocation.trim() || 'Counter / Table',
          slug: newQRName.toLowerCase().replace(/\s+/g, '-'),
          active: true,
          scanCount: 0,
          feedbackCount: 0,
          createdAt: new Date().toISOString(),
        };
        setQrList([newDemoQR, ...qrList]);
      } else {
        const item = await createQRCode(
          business.id,
          business.slug,
          newQRName.trim(),
          newQRLocation.trim() || 'Default Location'
        );
        setQrList([item, ...qrList]);
      }

      setNewQRName('');
      setNewQRLocation('');
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Create QR error:', err);
      setCreateError(err?.message || 'Failed to create QR code.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (qr: QRCodeItem) => {
    try {
      const nextStatus = !qr.active;
      if (!isDemoMode) {
        await toggleQRStatus(qr.id, nextStatus);
      }
      setQrList((prev) =>
        prev.map((item) => (item.id === qr.id ? { ...item, active: nextStatus } : item))
      );
    } catch (err) {
      console.error('Toggle QR status error:', err);
    }
  };

  const handleCopyLink = async (qr: QRCodeItem) => {
    const url = `${window.location.origin}/r/${business.slug || business.id}/${qr.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(qr.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy link error:', err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  QR Code Touchpoints
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {qrList.length} Active Touchpoints
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generate dedicated QR codes for specific tables, billing counters, patio umbrellas, or takeaway packaging.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="create-new-qr-btn"
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        {/* QR List Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-medium">Loading QR touchpoints...</span>
          </div>
        ) : qrList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-xs space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No QR Codes Created Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create your first QR touchpoint to place on billing counters or tables so customers can start leaving genuine reviews.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
            >
              Generate First QR Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrList.map((qr) => {
              const publicUrl = `${window.location.origin}/r/${business.slug || business.id}/${qr.id}`;

              return (
                <div
                  key={qr.id}
                  id={`qr-card-${qr.id}`}
                  className={`bg-white rounded-xl p-4 border shadow-xs transition-all space-y-3 relative ${
                    qr.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{qr.name}</h3>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            qr.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {qr.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{qr.location || 'Main Location'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(qr)}
                      title={qr.active ? 'Disable QR code' : 'Activate QR code'}
                      className={`p-1 rounded-lg text-xs transition-colors ${
                        qr.active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metrics Mini-Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Scans</div>
                      <div className="text-sm font-black text-slate-800">{qr.scanCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Feedbacks</div>
                      <div className="text-sm font-black text-indigo-600">{qr.feedbackCount || 0}</div>
                    </div>
                  </div>

                  {/* URL Row */}
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="flex-1 font-mono text-[10px] text-slate-600 truncate pl-1">
                      {publicUrl}
                    </span>
                    <button
                      onClick={() => handleCopyLink(qr)}
                      className="p-1 bg-white text-slate-700 hover:text-indigo-600 rounded border border-slate-200 shadow-2xs transition-colors shrink-0"
                      title="Copy Public URL"
                    >
                      {copiedId === qr.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      id={`view-qr-btn-${qr.id}`}
                      onClick={() => setSelectedQRForModal(qr)}
                      className="w-full py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View & Print</span>
                    </button>

                    <button
                      id={`test-flow-btn-${qr.id}`}
                      onClick={() => {
                        if (onOpenCustomerFlow) {
                          onOpenCustomerFlow(qr.id);
                        } else {
                          window.open(publicUrl, '_blank');
                        }
                      }}
                      className="w-full py-2 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Test Flow</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create QR Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create New QR Touchpoint</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateQR} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  QR Touchpoint Name *
                </label>
                <input
                  id="new-qr-name-input"
                  type="text"
                  required
                  value={newQRName}
                  onChange={(e) => setNewQRName(e.target.value)}
                  placeholder="e.g. Table 4, Billing Counter, Takeaway Bag"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Location Note (Optional)
                </label>
                <input
                  id="new-qr-location-input"
                  type="text"
                  value={newQRLocation}
                  onChange={(e) => setNewQRLocation(e.target.value)}
                  placeholder="e.g. Outdoor patio umbrella stand"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-qr-btn"
                  type="submit"
                  disabled={creating}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs disabled:opacity-50"
                >
                  {creating ? 'Generating QR...' : 'Create & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Display / Print Modal */}
      <QRModal
        isOpen={!!selectedQRForModal}
        onClose={() => setSelectedQRForModal(null)}
        qrCode={selectedQRForModal}
        business={business}
        onOpenCustomerFlow={onOpenCustomerFlow}
      />
    </div>
  );
};

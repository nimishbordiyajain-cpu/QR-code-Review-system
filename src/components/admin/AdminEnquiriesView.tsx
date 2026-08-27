import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  ExternalLink,
  Edit3,
  UserCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronDown,
  MessageSquare,
  Tag,
  Check,
} from 'lucide-react';
import { Enquiry, EnquiryStatus, BusinessProfile, BusinessCategory } from '../../types';
import { adminGetEnquiries, adminUpdateEnquiry } from '../../services/enquiryService';
import { AdminCreateBusinessInitialData } from './AdminCreateBusinessModal';

interface AdminEnquiriesViewProps {
  onConvertEnquiry: (initialData: AdminCreateBusinessInitialData, enquiryId: string) => void;
}

export const AdminEnquiriesView: React.FC<AdminEnquiriesViewProps> = ({ onConvertEnquiry }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');

  // Selected enquiry for detail modal / note editor
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchEnquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminGetEnquiries();
      setEnquiries(data);
    } catch (err: any) {
      console.error('Failed to load enquiries:', err);
      setError(err?.message || 'Failed to load client enquiries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus) => {
    setUpdatingStatusId(enquiryId);
    try {
      await adminUpdateEnquiry({ enquiryId, status: newStatus });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus, updatedAt: new Date().toISOString() } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(`Failed to update enquiry status: ${err?.message || 'Error'}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setIsSavingNotes(true);
    try {
      await adminUpdateEnquiry({
        enquiryId: selectedEnquiry.id,
        adminNotes: editingNotes.trim(),
      });
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === selectedEnquiry.id
            ? { ...e, adminNotes: editingNotes.trim(), updatedAt: new Date().toISOString() }
            : e
        )
      );
      setSelectedEnquiry((prev) => (prev ? { ...prev, adminNotes: editingNotes.trim() } : null));
    } catch (err: any) {
      alert(`Failed to save admin notes: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStartConversion = (enquiry: Enquiry) => {
    const initialData: AdminCreateBusinessInitialData = {
      name: enquiry.businessName,
      ownerName: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      category: (enquiry.category as BusinessCategory) || 'Restaurant',
      address: enquiry.city ? `${enquiry.city}` : '',
      adminNotes: `Converted from public enquiry submitted on ${new Date(enquiry.createdAt).toLocaleDateString()}. ${
        enquiry.message ? `Enquiry note: "${enquiry.message}"` : ''
      }`,
    };
    onConvertEnquiry(initialData, enquiry.id);
  };

  // Metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const contactedCount = enquiries.filter((e) => e.status === 'contacted').length;
  const convertedCount = enquiries.filter((e) => e.status === 'converted').length;

  // Filtered List
  const filteredEnquiries = enquiries.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.businessName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.source && item.source.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>New Enquiry</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Contacted</span>
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Converted Client</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Archived</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Enquiries</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-between">
            <span>Action Needed</span>
            {newCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{newCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">In Progress / Contacted</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{contactedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Converted Clients</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{convertedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business, name, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-indigo-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'new', 'contacted', 'converted', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Enquiries' : st}
              {st === 'new' && newCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px]">
                  {newCount}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={() => fetchEnquiries(true)}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Loading prospective client enquiries...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchEnquiries()}
            className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Enquiries Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No prospective client enquiries match your current filters.'
              : 'Prospective clients who submit the public form at /enquire will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Business & Contact</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Category & Location</th>
                  <th className="py-3 px-4">Source / Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Business & Contact Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{enq.businessName}</span>
                      </div>
                      <div className="text-slate-500 font-medium mt-0.5 flex items-center gap-1 text-[11px]">
                        <span>{enq.name}</span>
                      </div>
                      {enq.message && (
                        <div className="text-slate-500 text-[11px] mt-1 line-clamp-1 italic max-w-xs">
                          "{enq.message}"
                        </div>
                      )}
                    </td>

                    {/* Contact Info (Email & Phone) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${enq.email}`}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{enq.email}</span>
                        </a>
                        <a
                          href={`tel:${enq.phone}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{enq.phone}</span>
                        </a>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{enq.category || 'General'}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{enq.city || 'Location unstated'}</span>
                      </div>
                    </td>

                    {/* Source & Date */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-600 text-[11px]">
                        {new Date(enq.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[120px]">
                        {enq.source || 'Direct'}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        {getStatusBadge(enq.status)}
                        <select
                          value={enq.status}
                          disabled={updatingStatusId === enq.id}
                          onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
                          className="block text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-indigo-600 cursor-pointer"
                        >
                          <option value="new">Mark as New</option>
                          <option value="contacted">Mark as Contacted</option>
                          <option value="converted">Mark as Converted</option>
                          <option value="archived">Mark as Archived</option>
                        </select>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View & Notes button */}
                        <button
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setEditingNotes(enq.adminNotes || '');
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View full enquiry & notes"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Notes</span>
                        </button>

                        {/* Convert to Business Account button */}
                        {enq.status !== 'converted' ? (
                          <button
                            onClick={() => handleStartConversion(enq)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            title="Pre-fill Provisioning Modal"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Create Account</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Converted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Notes Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedEnquiry.businessName}</h3>
                <p className="text-xs text-slate-500">
                  Enquiry ID: <span className="font-mono">{selectedEnquiry.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Status and Submission Date */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Current Status</div>
                  <div className="mt-1">{getStatusBadge(selectedEnquiry.status)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Submitted On</div>
                  <div className="font-medium text-slate-800 mt-1">
                    {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Contact Details Card */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-slate-400 text-[10px]">Contact Person</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedEnquiry.name}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Category</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedEnquiry.category}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Email Address</div>
                    <a
                      href={`mailto:${selectedEnquiry.email}`}
                      className="font-semibold text-indigo-600 hover:underline block truncate mt-0.5"
                    >
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Phone</div>
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="font-semibold text-slate-800 hover:underline block mt-0.5"
                    >
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">City / Location</div>
                    <div className="text-slate-700 mt-0.5">{selectedEnquiry.city || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Referral Source</div>
                    <div className="text-slate-700 mt-0.5">{selectedEnquiry.source || 'Direct'}</div>
                  </div>
                </div>
              </div>

              {/* Message from Prospect */}
              {selectedEnquiry.message && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Prospect Remarks & Goals
                  </div>
                  <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-slate-800 leading-relaxed italic text-xs">
                    "{selectedEnquiry.message}"
                  </div>
                </div>
              )}

              {/* Internal Admin Notes Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Internal Admin Notes
                  </span>
                  <span className="text-[10px] text-slate-400">Visible only to admins</span>
                </div>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Record call logs, price agreed upon, custom QR requirement notes..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  handleStartConversion(selectedEnquiry);
                  setSelectedEnquiry(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Convert to Business Account</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

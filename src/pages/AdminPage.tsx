import React, { useEffect, useState, useMemo } from 'react';
import { BusinessProfile } from '../types';
import { getAllBusinesses } from '../services/businessService';
import { getAllFeedback } from '../services/feedbackService';
import { adminGetTodayUsage, adminUpdateBusiness } from '../services/adminService';
import { AdminSummaryCards } from '../components/admin/AdminSummaryCards';
import { AdminCreateBusinessModal } from '../components/admin/AdminCreateBusinessModal';
import { AdminEditBusinessModal } from '../components/admin/AdminEditBusinessModal';
import { AdminResetPasswordModal } from '../components/admin/AdminResetPasswordModal';
import { AdminDeleteBusinessModal } from '../components/admin/AdminDeleteBusinessModal';
import { AdminWelcomeMessageModal } from '../components/admin/AdminWelcomeMessageModal';
import { AdminRightsModal } from '../components/admin/AdminRightsModal';
import { AdminEnquiriesView } from '../components/admin/AdminEnquiriesView';
import { adminGetEnquiries, adminUpdateEnquiry } from '../services/enquiryService';
import { AdminCreateBusinessInitialData } from '../components/admin/AdminCreateBusinessModal';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Filter,
  Check,
  Building2,
  CreditCard,
  Plus,
  Inbox,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate?: (view: string) => void;
}

type AdminTab = 'businesses' | 'enquiries';
type StatusFilter = 'all' | 'active' | 'disabled';
type RenewalFilter = 'all' | 'due-soon' | 'overdue' | 'healthy';
type SortOption = 'renewal-soonest' | 'name-asc' | 'created-newest' | 'usage-highest';

export const AdminPage: React.FC<AdminPageProps> = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('businesses');
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [totalFeedbacksCount, setTotalFeedbacksCount] = useState(0);
  const [newEnquiryCount, setNewEnquiryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [renewalFilter, setRenewalFilter] = useState<RenewalFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('renewal-soonest');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRightsModal, setShowRightsModal] = useState(false);
  const [createModalInitialData, setCreateModalInitialData] = useState<AdminCreateBusinessInitialData | undefined>(undefined);
  const [convertingEnquiryId, setConvertingEnquiryId] = useState<string | null>(null);

  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  const [resettingBusiness, setResettingBusiness] = useState<BusinessProfile | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessProfile | null>(null);
  const [welcomeKitBusiness, setWelcomeKitBusiness] = useState<{
    business: BusinessProfile;
    passwordResetLink?: string;
    rawPassword?: string;
  } | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [bizList, fbList, usageStats, enquiriesList] = await Promise.all([
        getAllBusinesses(),
        getAllFeedback(),
        adminGetTodayUsage(),
        adminGetEnquiries().catch(() => []),
      ]);

      setBusinesses(bizList);
      setTotalFeedbacksCount(fbList.length);
      setUsageMap(usageStats);
      setNewEnquiryCount(enquiriesList.filter((e) => e.status === 'new').length);
    } catch (err) {
      console.error('Error loading admin dashboard records:', err);
      triggerToast('Failed to sync latest records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleStartConversionFromEnquiry = (
    initialData: AdminCreateBusinessInitialData,
    enquiryId: string
  ) => {
    setCreateModalInitialData(initialData);
    setConvertingEnquiryId(enquiryId);
    setShowCreateModal(true);
  };

  const handleToggleStatus = async (biz: BusinessProfile) => {
    const nextStatus = biz.status === 'active' ? 'disabled' : 'active';
    try {
      await adminUpdateBusiness({
        businessId: biz.id,
        status: nextStatus,
      });

      setBusinesses((prev) =>
        prev.map((b) => (b.id === biz.id ? { ...b, status: nextStatus } : b))
      );
      triggerToast(`Account status updated to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      triggerToast(err?.message || 'Failed to update account status.');
    }
  };

  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Filter & Sort Logic
  const filteredAndSortedBusinesses = useMemo(() => {
    return businesses
      .filter((biz) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = biz.name?.toLowerCase().includes(q);
          const matchOwner = biz.ownerName?.toLowerCase().includes(q);
          const matchEmail = biz.email?.toLowerCase().includes(q);
          const matchPhone = biz.phone?.toLowerCase().includes(q) || biz.ownerPhone?.toLowerCase().includes(q);
          const matchSlug = biz.slug?.toLowerCase().includes(q);
          if (!matchName && !matchOwner && !matchEmail && !matchPhone && !matchSlug) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== 'all' && biz.status !== statusFilter) {
          return false;
        }

        // Renewal filter
        if (renewalFilter !== 'all') {
          if (!biz.nextRenewalDate) return false;
          const rDate = new Date(biz.nextRenewalDate);
          const rMs = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime();
          const diffDays = Math.round((rMs - todayMs) / (1000 * 60 * 60 * 24));

          if (renewalFilter === 'overdue' && diffDays >= 0) return false;
          if (renewalFilter === 'due-soon' && (diffDays < 0 || diffDays > 7)) return false;
          if (renewalFilter === 'healthy' && diffDays <= 7) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'created-newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'usage-highest') {
          const usageA = usageMap[a.id] || 0;
          const usageB = usageMap[b.id] || 0;
          return usageB - usageA;
        }
        // default: renewal-soonest
        const rDateA = a.nextRenewalDate ? new Date(a.nextRenewalDate).getTime() : Infinity;
        const rDateB = b.nextRenewalDate ? new Date(b.nextRenewalDate).getTime() : Infinity;
        return rDateA - rDateB;
      });
  }, [businesses, search, statusFilter, renewalFilter, sortBy, usageMap, todayMs]);

  const renderRenewalBadge = (nextRenewalDate?: string) => {
    if (!nextRenewalDate) {
      return <span className="text-[10px] text-slate-400 font-medium">Not configured</span>;
    }

    const rDate = new Date(nextRenewalDate);
    const rMs = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime();
    const diffDays = Math.round((rMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-700 font-medium">
            {rDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-fit mt-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            Overdue ({Math.abs(diffDays)}d)
          </span>
        </div>
      );
    }

    if (diffDays <= 7) {
      return (
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-700 font-medium">
            {rDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            Due in {diffDays}d
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-700 font-semibold">
          {rDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="text-[9px] text-slate-400">In {diffDays} days</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                  Admin Central Dashboard
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30 font-bold">
                    Super Admin
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Client provisioning, manual billing tracking, and security controls
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRightsModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition-all border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Rights</span>
              </button>

              <button
                onClick={() => {
                  setCreateModalInitialData(undefined);
                  setConvertingEnquiryId(null);
                  setShowCreateModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('businesses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'businesses'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Businesses ({businesses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('enquiries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Prospective Enquiries</span>
              {newEnquiryCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 animate-pulse">
                  {newEnquiryCount} new
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4">
        {activeTab === 'enquiries' ? (
          <AdminEnquiriesView
            onConvertEnquiry={handleStartConversionFromEnquiry}
          />
        ) : (
          <>
            {/* Metric Summary Cards */}
            <AdminSummaryCards
              businesses={businesses}
              totalFeedbackCount={totalFeedbacksCount}
              loading={loading}
              onRefresh={loadAdminData}
              onOpenCreateModal={() => {
                setCreateModalInitialData(undefined);
                setConvertingEnquiryId(null);
                setShowCreateModal(true);
              }}
            />

            {/* Business Directory & Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Filter Bar */}
              <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
                {/* Search Input */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, owner, email, slug..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600"
                  />
                </div>

                {/* Filter Pills & Sorters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      All ({businesses.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setStatusFilter('disabled')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        statusFilter === 'disabled' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Disabled
                    </button>
                  </div>

                  {/* Renewal Filter */}
                  <select
                    value={renewalFilter}
                    onChange={(e) => setRenewalFilter(e.target.value as RenewalFilter)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-indigo-600 cursor-pointer"
                  >
                    <option value="all">All Renewals</option>
                    <option value="due-soon">Due Soon (≤ 7 days)</option>
                    <option value="overdue">Overdue Renewals</option>
                    <option value="healthy">Healthy (&gt; 7 days)</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-indigo-600 cursor-pointer"
                  >
                    <option value="renewal-soonest">Sort: Renewal Soonest</option>
                    <option value="name-asc">Sort: Name (A-Z)</option>
                    <option value="created-newest">Sort: Created Newest</option>
                    <option value="usage-highest">Sort: AI Usage Today</option>
                  </select>
                </div>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Business Profile</th>
                      <th className="py-3 px-4">Owner & Login Email</th>
                      <th className="py-3 px-4">Plan & Subscription</th>
                      <th className="py-3 px-4">Next Renewal</th>
                      <th className="py-3 px-4">AI Usage Today</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAndSortedBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold">No businesses match your filter criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedBusinesses.map((biz) => {
                        const todayUsage = usageMap[biz.id] || 0;
                        const dailyLimit = biz.dailyGenerationLimit || 50;
                        const usagePercent = Math.min(100, Math.round((todayUsage / dailyLimit) * 100));

                        return (
                          <tr key={biz.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Business Details */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                  {biz.logoUrl ? (
                                    <img
                                      src={biz.logoUrl}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    biz.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{biz.name}</span>
                                    <a
                                      href={`/review/${biz.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Open public review page"
                                      className="text-slate-400 hover:text-indigo-600"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                      {biz.category}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-500">/review/{biz.slug}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Owner Info */}
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-800">{biz.ownerName || '—'}</div>
                              <div className="text-[10px] font-mono text-slate-500">{biz.email || '—'}</div>
                              {(biz.ownerPhone || biz.phone) && (
                                <div className="text-[10px] text-slate-400">
                                  {biz.ownerPhone || biz.phone}
                                </div>
                              )}
                            </td>

                            {/* Plan & Subscription */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  {biz.planName || 'Standard'}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  ₹{(biz.amountPaid ?? 1999).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                                {biz.billingCycle || 'monthly'} cycle
                              </div>
                            </td>

                            {/* Renewal Date */}
                            <td className="py-3 px-4">
                              {renderRenewalBadge(biz.nextRenewalDate)}
                            </td>

                            {/* AI Usage */}
                            <td className="py-3 px-4">
                              <div className="w-28 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">{todayUsage} / {dailyLimit}</span>
                                  <span className="text-slate-400">{usagePercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      usagePercent > 90
                                        ? 'bg-rose-500'
                                        : usagePercent > 60
                                        ? 'bg-amber-500'
                                        : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  biz.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {biz.status}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Welcome Message Modal */}
                                <button
                                  onClick={() => setWelcomeKitBusiness({ business: biz })}
                                  title="View & Copy Client Welcome Message"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Business Profile & Plan */}
                                <button
                                  onClick={() => setEditingBusiness(biz)}
                                  title="Edit Details & Subscription"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Regenerate Password Link */}
                                <button
                                  onClick={() => setResettingBusiness(biz)}
                                  title="Regenerate Password Link"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 transition-colors cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Active / Disabled */}
                                <button
                                  onClick={() => handleToggleStatus(biz)}
                                  title={biz.status === 'active' ? 'Disable Account' : 'Activate Account'}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    biz.status === 'active'
                                      ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {biz.status === 'active' ? (
                                    <XCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Delete Business */}
                                <button
                                  onClick={() => setDeletingBusiness(biz)}
                                  title="Deprovision & Delete Business"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal 1: Create Client Business */}
      {showCreateModal && (
        <AdminCreateBusinessModal
          initialData={createModalInitialData}
          onClose={() => {
            setShowCreateModal(false);
            setCreateModalInitialData(undefined);
            setConvertingEnquiryId(null);
          }}
          onSuccess={async (createdBiz, resetLink) => {
            setShowCreateModal(false);
            setCreateModalInitialData(undefined);
            
            // If converting from an enquiry, mark enquiry as converted
            if (convertingEnquiryId) {
              try {
                await adminUpdateEnquiry({
                  enquiryId: convertingEnquiryId,
                  status: 'converted',
                  convertedBusinessId: createdBiz.id,
                });
                triggerToast(`Enquiry converted & Client "${createdBiz.name}" provisioned!`);
              } catch (e) {
                console.warn('Could not update enquiry status on conversion:', e);
              }
              setConvertingEnquiryId(null);
            } else {
              triggerToast(`Client "${createdBiz.name}" provisioned successfully!`);
            }

            setBusinesses((prev) => [createdBiz, ...prev]);
            setWelcomeKitBusiness({
              business: createdBiz,
              passwordResetLink: resetLink,
              rawPassword,
            });
            loadAdminData();
          }}
        />
      )}

      {/* Modal 2: Edit Business & Subscription */}
      {editingBusiness && (
        <AdminEditBusinessModal
          business={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSuccess={() => {
            setEditingBusiness(null);
            loadAdminData();
            triggerToast('Business profile and subscription updated.');
          }}
        />
      )}

      {/* Modal 3: Reset Password Link */}
      {resettingBusiness && (
        <AdminResetPasswordModal
          business={resettingBusiness}
          onClose={() => setResettingBusiness(null)}
          onSuccess={(newTime) => {
            setBusinesses((prev) =>
              prev.map((b) =>
                b.id === resettingBusiness.id
                  ? { ...b, lastCredentialResetAt: newTime }
                  : b
              )
            );
            triggerToast('Password link regenerated and timestamp logged.');
          }}
        />
      )}

      {/* Modal 4: Deprovision & Delete Business */}
      {deletingBusiness && (
        <AdminDeleteBusinessModal
          business={deletingBusiness}
          onClose={() => setDeletingBusiness(null)}
          onSuccess={() => {
            setBusinesses((prev) => prev.filter((b) => b.id !== deletingBusiness.id));
            setDeletingBusiness(null);
            triggerToast('Business account and all linked records permanently deleted.');
          }}
        />
      )}

      {/* Modal 5: Welcome Kit / Copyable Message */}
      {welcomeKitBusiness && (
        <AdminWelcomeMessageModal
          business={welcomeKitBusiness.business}
          passwordResetLink={welcomeKitBusiness.passwordResetLink}
          onClose={() => setWelcomeKitBusiness(null)}
        />
      )}

      {/* Modal 6: Super Admin Rights & Privileges Overview */}
      <AdminRightsModal
        isOpen={showRightsModal}
        onClose={() => setShowRightsModal(false)}
      />
    </div>
  );
};

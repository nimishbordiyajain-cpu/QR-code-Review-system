import React from 'react';
import { BusinessProfile } from '../../types';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  IndianRupee,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface AdminSummaryCardsProps {
  businesses: BusinessProfile[];
  totalFeedbackCount: number;
  loading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const AdminSummaryCards: React.FC<AdminSummaryCardsProps> = ({
  businesses,
  totalFeedbackCount,
  loading,
  onRefresh,
  onOpenCreateModal,
}) => {
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let activeCount = 0;
  let disabledCount = 0;
  let dueSoonCount = 0;
  let overdueCount = 0;
  let totalRevenue = 0;

  businesses.forEach((biz) => {
    if (biz.status === 'active') {
      activeCount++;
      totalRevenue += biz.amountPaid || 0;
    } else {
      disabledCount++;
    }

    if (biz.nextRenewalDate) {
      const renewalDate = new Date(biz.nextRenewalDate);
      const renewalMs = new Date(
        renewalDate.getFullYear(),
        renewalDate.getMonth(),
        renewalDate.getDate()
      ).getTime();

      const diffDays = Math.round((renewalMs - todayMs) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        overdueCount++;
      } else if (diffDays <= 7) {
        dueSoonCount++;
      }
    }
  });

  return (
    <div className="space-y-4">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Admin Operations & Client Provisioning</h2>
          <p className="text-xs text-slate-500">
            Personal client onboarding, manual subscription renewals, and credentials management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="admin-refresh-btn"
            onClick={onRefresh}
            title="Refresh database records"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            id="admin-open-create-btn"
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Client</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Businesses */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Clients
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">{businesses.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">{activeCount} active</span>
            <span>•</span>
            <span className="text-slate-400">{disabledCount} disabled</span>
          </div>
        </div>

        {/* Renewals Due Soon */}
        <div
          className={`p-3.5 rounded-xl border shadow-xs transition-colors ${
            dueSoonCount > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                dueSoonCount > 0 ? 'text-amber-800' : 'text-slate-500'
              }`}
            >
              Due Soon (≤ 7d)
            </span>
            <Clock className={`w-4 h-4 ${dueSoonCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-black ${dueSoonCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {dueSoonCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {dueSoonCount > 0 ? 'Manual collection needed' : 'All subscriptions current'}
          </div>
        </div>

        {/* Renewals Overdue */}
        <div
          className={`p-3.5 rounded-xl border shadow-xs transition-colors ${
            overdueCount > 0
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                overdueCount > 0 ? 'text-rose-800' : 'text-slate-500'
              }`}
            >
              Overdue Renewals
            </span>
            <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-black ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overdueCount > 0 ? 'Follow-up required' : 'Zero payment defaults'}
          </div>
        </div>

        {/* Total Feedback Collected */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Feedbacks
            </span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600">
            {totalFeedbackCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Platform customer entries</div>
        </div>

        {/* Revenue Under Management */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Active Volume
            </span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total collected active fees</div>
        </div>
      </div>
    </div>
  );
};

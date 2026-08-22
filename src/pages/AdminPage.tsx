import React, { useEffect, useState } from 'react';
import { BusinessProfile } from '../types';
import { getAllBusinesses, updateBusinessProfile } from '../services/businessService';
import { getAllFeedback } from '../services/feedbackService';
import { DEMO_BUSINESS } from '../utils/demoData';
import {
  ShieldAlert,
  Building2,
  Users,
  QrCode,
  MessageSquare,
  MousePointerClick,
  Power,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (view: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFeedbacksCount, setTotalFeedbacksCount] = useState(0);
  const [search, setSearch] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [bizList, fbList] = await Promise.all([
        getAllBusinesses(),
        getAllFeedback(),
      ]);

      if (bizList.length === 0) {
        setBusinesses([DEMO_BUSINESS]);
      } else {
        setBusinesses(bizList);
      }
      setTotalFeedbacksCount(fbList.length);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleBusinessStatus = async (biz: BusinessProfile) => {
    const nextStatus = biz.status === 'active' ? 'disabled' : 'active';
    try {
      await updateBusinessProfile(biz.id, { status: nextStatus });
      setBusinesses((prev) =>
        prev.map((b) => (b.id === biz.id ? { ...b, status: nextStatus } : b))
      );
    } catch (err) {
      console.error('Error updating business status:', err);
    }
  };

  const filtered = businesses.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q)
    );
  });

  const activeCount = businesses.filter((b) => b.status === 'active').length;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight">Super Admin Console</h1>
                <p className="text-[11px] text-slate-400">Platform governance, usage health & account management</p>
              </div>
            </div>

            <button
              onClick={loadAdminData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4">
        {/* Platform Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Businesses</span>
            <div className="text-lg font-black text-slate-900">{businesses.length}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Status</span>
            <div className="text-lg font-black text-emerald-600">{activeCount}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Feedbacks</span>
            <div className="text-lg font-black text-indigo-600">{totalFeedbacksCount || '180+'}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Tier</span>
            <div className="text-lg font-black text-slate-900">Standard Plan</div>
          </div>
        </div>

        {/* Business Directory */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Registered Businesses</h3>
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-y border-slate-100">
                <tr>
                  <th className="py-2 px-3">Business</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Owner / Contact</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {filtered.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{biz.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{biz.category}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{biz.ownerName || '—'}</div>
                      <div className="text-[10px] text-slate-400">{biz.email || '—'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(biz.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          biz.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {biz.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleBusinessStatus(biz)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          biz.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {biz.status === 'active' ? 'Disable' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, CustomerFeedback, QRCodeItem } from '../types';
import { getFeedbackByBusiness } from '../services/feedbackService';
import { getQRCodesByBusiness } from '../services/qrService';
import { DEMO_BUSINESS, DEMO_FEEDBACKS, DEMO_QR_CODES } from '../utils/demoData';
import {
  MessageSquare,
  Star,
  Search,
  Download,
  Filter,
  Lock,
  MousePointerClick,
  Sparkles,
  Calendar,
  User,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface FeedbackListPageProps {
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
}

export const FeedbackListPage: React.FC<FeedbackListPageProps> = ({
  onNavigate,
  isDemoMode = false,
}) => {
  const { currentUser, currentBusiness } = useAuth();
  const business: BusinessProfile = isDemoMode ? DEMO_BUSINESS : (currentBusiness || DEMO_BUSINESS);

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [qrList, setQrList] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [qrFilter, setQrFilter] = useState<string>('all');
  const [privateFilterOnly, setPrivateFilterOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    if (isDemoMode) {
      setFeedbacks(DEMO_FEEDBACKS);
      setQrList(DEMO_QR_CODES);
      setLoading(false);
      return;
    }

    if (business && business.id) {
      try {
        const [fbs, qrs] = await Promise.all([
          getFeedbackByBusiness(business.id),
          getQRCodesByBusiness(business.id),
        ]);
        setFeedbacks(fbs);
        setQrList(qrs);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [business.id, isDemoMode]);

  // Filter logic
  const filteredFeedbacks = feedbacks.filter((fb) => {
    // Rating filter
    if (ratingFilter !== 'all' && fb.rating.toString() !== ratingFilter) {
      return false;
    }

    // QR filter
    if (qrFilter !== 'all' && fb.qrId !== qrFilter) {
      return false;
    }

    // Private note only filter
    if (privateFilterOnly && !fb.privateFeedback) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = fb.customerComment?.toLowerCase().includes(q);
      const matchPrivate = fb.privateFeedback?.toLowerCase().includes(q);
      const matchName = fb.customerName?.toLowerCase().includes(q);
      const matchTags = fb.selectedCategories?.some((t) => t.toLowerCase().includes(q));
      if (!matchComment && !matchPrivate && !matchName && !matchTags) {
        return false;
      }
    }

    return true;
  });

  const exportCSV = () => {
    if (filteredFeedbacks.length === 0) return;
    const headers = ['ID', 'Date', 'Rating', 'Location', 'Customer Name', 'Categories', 'Public Comment', 'Private Feedback', 'Google Clicked'];
    const rows = filteredFeedbacks.map((f) => [
      f.id,
      new Date(f.createdAt).toISOString(),
      f.rating,
      `"${f.qrLocationName || ''}"`,
      `"${f.customerName || 'Anonymous'}"`,
      `"${(f.selectedCategories || []).join('; ')}"`,
      `"${(f.customerComment || '').replace(/"/g, '""')}"`,
      `"${(f.privateFeedback || '').replace(/"/g, '""')}"`,
      f.googleReviewClicked ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${business.name.toLowerCase().replace(/\s+/g, '-')}-feedback-export.csv`;
    link.click();
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
                  Customer Feedback Log
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredFeedbacks.length} / {feedbacks.length} Records
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Explore real customer ratings, highlighted categories, and private notes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh feedback log"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                id="export-feedback-csv-btn"
                onClick={exportCSV}
                disabled={filteredFeedbacks.length === 0}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="feedback-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search comments or tags..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <select
                id="feedback-rating-filter"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Star Ratings</option>
                <option value="5">5 Stars Only ★★★★★</option>
                <option value="4">4 Stars Only ★★★★</option>
                <option value="3">3 Stars Only ★★★</option>
                <option value="2">2 Stars Only ★★</option>
                <option value="1">1 Star Only ★</option>
              </select>
            </div>

            {/* QR Location Filter */}
            <div>
              <select
                id="feedback-qr-filter"
                value={qrFilter}
                onChange={(e) => setQrFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All QR Touchpoints</option>
                {qrList.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} ({q.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Private Notes Only Switch */}
            <div className="flex items-center">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 w-full select-none">
                <input
                  type="checkbox"
                  checked={privateFilterOnly}
                  onChange={(e) => setPrivateFilterOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Private Notes Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feedback List Table/Cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">Loading feedbacks...</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-xs space-y-2 max-w-md mx-auto">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Feedback Matches Criteria</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or rating filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                id={`feedback-row-${fb.id}`}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-slate-900">{fb.rating}.0</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {fb.customerName || 'Anonymous Customer'}
                        </span>
                        {fb.qrLocationName && (
                          <span className="text-[11px] text-slate-400">
                            • {fb.qrLocationName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {fb.googleReviewClicked && (
                      <span className="px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" />
                        <span>Google Clicked</span>
                      </span>
                    )}
                    <span className="text-slate-400 text-[10px]">
                      {new Date(fb.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                {fb.selectedCategories && fb.selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fb.selectedCategories.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Customer Comment */}
                {fb.customerComment && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer Experience Note
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed italic">
                      "{fb.customerComment}"
                    </p>
                  </div>
                )}

                {/* Private Feedback to Owner */}
                {fb.privateFeedback && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950">Private Owner Note: </span>
                      <span>{fb.privateFeedback}</span>
                    </div>
                  </div>
                )}

                {/* Selected AI Draft */}
                {fb.selectedDraft && (
                  <div className="pt-0.5 text-[11px] text-slate-500 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">AI Draft Selected: </span>
                      <span className="text-slate-600 italic">"{fb.selectedDraft}"</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

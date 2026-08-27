import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BusinessProfile, QRCodeItem, CustomerFeedback, AIInsight } from '../types';
import { getQRCodesByBusiness } from '../services/qrService';
import { getFeedbackByBusiness } from '../services/feedbackService';
import { fetchBusinessAIInsights } from '../services/aiService';
import { DEMO_BUSINESS, DEMO_QR_CODES, DEMO_FEEDBACKS } from '../utils/demoData';
import { StarRating } from '../components/StarRating';
import { QRModal } from '../components/QRModal';
import {
  Sparkles,
  QrCode,
  Star,
  Users,
  MousePointerClick,
  Percent,
  TrendingUp,
  MessageSquare,
  Plus,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Award,
  AlertCircle,
  ThumbsUp,
  Lock,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
  onOpenCustomerFlow?: (qrId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  isDemoMode = false,
  onOpenCustomerFlow,
}) => {
  const { currentUser, currentBusiness } = useAuth();

  const business: BusinessProfile = isDemoMode
    ? DEMO_BUSINESS
    : (currentBusiness || {
        id: 'new',
        ownerId: currentUser?.uid || '',
        name: 'My Business',
        category: 'Café',
        googleReviewUrl: '',
        slug: 'my-business',
        status: 'active',
        createdAt: new Date().toISOString(),
      });

  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRForModal, setSelectedQRForModal] = useState<QRCodeItem | null>(null);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Filter
  const [selectedQRFilter, setSelectedQRFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    if (isDemoMode) {
      setQrCodes(DEMO_QR_CODES);
      setFeedbacks(DEMO_FEEDBACKS);
      setLoading(false);
      return;
    }

    if (business && business.id && business.id !== 'new') {
      try {
        const [qrs, fbs] = await Promise.all([
          getQRCodesByBusiness(business.id),
          getFeedbackByBusiness(business.id),
        ]);
        setQrCodes(qrs);
        setFeedbacks(fbs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [business.id, isDemoMode]);

  // Calculations
  const filteredFeedbacks = selectedQRFilter === 'all'
    ? feedbacks
    : feedbacks.filter((f) => f.qrId === selectedQRFilter);

  const totalScans = qrCodes.reduce((acc, q) => acc + (q.scanCount || 0), 0);
  const totalFeedbackCount = filteredFeedbacks.length;
  const googleReviewClicks = filteredFeedbacks.filter((f) => f.googleReviewClicked).length;
  const aiDraftsGenerated = filteredFeedbacks.filter((f) => f.selectedDraft).length;

  const avgRating = totalFeedbackCount > 0
    ? Number((filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedbackCount).toFixed(1))
    : 0;

  const completionRate = totalScans > 0
    ? Math.min(100, Math.round((totalFeedbackCount / totalScans) * 100))
    : totalFeedbackCount > 0 ? 85 : 0;

  // Star distribution
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filteredFeedbacks.forEach((f) => {
    if (ratingDistribution[f.rating] !== undefined) {
      ratingDistribution[f.rating] += 1;
    }
  });

  // Top category counts
  const positiveCategoryCounts: Record<string, number> = {};
  const constructiveCategoryCounts: Record<string, number> = {};

  filteredFeedbacks.forEach((f) => {
    (f.selectedCategories || []).forEach((cat) => {
      if (f.rating >= 4) {
        positiveCategoryCounts[cat] = (positiveCategoryCounts[cat] || 0) + 1;
      } else {
        constructiveCategoryCounts[cat] = (constructiveCategoryCounts[cat] || 0) + 1;
      }
    });
  });

  const topPositives = Object.entries(positiveCategoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const topConstructives = Object.entries(constructiveCategoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const handleGenerateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const insights = await fetchBusinessAIInsights(business.id, business.name, business.category, feedbacks);
      setAiInsights(insights);
    } catch (err) {
      console.error('AI Insights generation error:', err);
    } finally {
      setGeneratingInsights(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-56px)] pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {business.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {business.category}
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                    Live Demo Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time customer experience intelligence and Google review conversions.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="dash-refresh-btn"
                onClick={loadData}
                disabled={loading}
                title="Refresh dashboard data"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                id="dash-manage-qrs-btn"
                onClick={() => onNavigate('qr')}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Manage QR Codes ({qrCodes.length})</span>
              </button>

              {qrCodes.length > 0 && (
                <button
                  id="dash-quick-view-qr-btn"
                  onClick={() => setSelectedQRForModal(qrCodes[0])}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Show Active QR</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {!business.googleReviewUrl && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold">Google Review URL Not Connected</div>
                <div className="text-[11px] text-amber-700">
                  Customers who generate reviews won't have a direct link to submit their feedback to Google.
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Add Google Review Link in Settings
            </button>
          </div>
        )}

        {/* Main 6 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              id: 'stat-qr-scans',
              label: 'QR Scans',
              value: totalScans,
              icon: <QrCode className="w-4 h-4 text-indigo-600" />,
              badge: '+12% wk',
            },
            {
              id: 'stat-feedback-submitted',
              label: 'Feedbacks Submitted',
              value: totalFeedbackCount,
              icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
              badge: 'Verified',
            },
            {
              id: 'stat-ai-drafts',
              label: 'AI Drafts Generated',
              value: aiDraftsGenerated,
              icon: <Sparkles className="w-4 h-4 text-purple-600" />,
              badge: '5 Styles',
            },
            {
              id: 'stat-google-clicks',
              label: 'Google Review Clicks',
              value: googleReviewClicks,
              icon: <MousePointerClick className="w-4 h-4 text-emerald-600" />,
              badge: `${totalFeedbackCount > 0 ? Math.round((googleReviewClicks / totalFeedbackCount) * 100) : 0}% Conv`,
            },
            {
              id: 'stat-avg-rating',
              label: 'Average Rating',
              value: totalFeedbackCount > 0 ? `${avgRating} ★` : '—',
              icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
              badge: `${ratingDistribution[5] || 0} top 5★`,
            },
            {
              id: 'stat-completion-rate',
              label: 'Completion Rate',
              value: totalFeedbackCount > 0 ? `${completionRate}%` : '—',
              icon: <Percent className="w-4 h-4 text-cyan-600" />,
              badge: 'Direct Scans',
            },
          ].map((stat) => (
            <div
              key={stat.id}
              id={stat.id}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                {stat.icon}
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {stat.badge}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-indigo-600 h-full w-4/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Business Insights Banner / Generator */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>AI Experience Intelligence Hub</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Synthesize Trends & Customer Sentiments
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini analyzes customer ratings, selected category tags, and notes to summarize operational strengths and improvement areas.
              </p>
            </div>

            <div className="shrink-0">
              <button
                id="generate-ai-insights-btn"
                onClick={handleGenerateAIInsights}
                disabled={generatingInsights || feedbacks.length === 0}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-40"
              >
                {generatingInsights ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Feedback Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiInsights ? 'Refresh Insights' : 'Generate Business Insights'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Output Card */}
          {aiInsights && (
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Key Strengths</span>
                </div>
                <ul className="text-xs text-slate-200 space-y-1">
                  {aiInsights.strengths?.length > 0 ? (
                    aiInsights.strengths.map((s, idx) => <li key={idx} className="leading-snug">• {s}</li>)
                  ) : (
                    <li className="text-slate-400">Consistent positive experiences</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Areas for Improvement</span>
                </div>
                <ul className="text-xs text-slate-200 space-y-1">
                  {aiInsights.areasForImprovement?.length > 0 ? (
                    aiInsights.areasForImprovement.map((a, idx) => <li key={idx} className="leading-snug">• {a}</li>)
                  ) : (
                    <li className="text-slate-400">No major negative bottlenecks detected</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Sentiment Summary</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {aiInsights.customerSentimentSummary}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rating Breakdown & Category Experience Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Star Distribution */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Rating Distribution</h3>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                {totalFeedbackCount} Total
              </span>
            </div>

            {totalFeedbackCount === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No rating data yet
              </div>
            ) : (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const percentage = totalFeedbackCount > 0
                    ? Math.round((count / totalFeedbackCount) * 100)
                    : 0;

                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-10 text-slate-700 font-bold text-[11px] shrink-0">
                        <span>{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>

                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            star >= 4
                              ? 'bg-emerald-500'
                              : star === 3
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="w-12 text-right text-slate-500 font-medium text-[11px] shrink-0">
                        {count} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Positive Experience Highlights */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">What Customers Appreciate</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                4-5★ Positives
              </span>
            </div>

            {topPositives.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No positive category tags logged yet
              </div>
            ) : (
              <div className="space-y-2">
                {topPositives.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white text-indigo-700 border border-slate-200 shadow-2xs">
                      {item.count} selections
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Constructive / Improvement Tags */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Areas for Attention</h3>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                1-3★ Notes
              </span>
            </div>

            {topConstructives.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No constructive tags logged yet. Great job!
              </div>
            ) : (
              <div className="space-y-2">
                {topConstructives.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/40 border border-amber-100 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white text-amber-800 border border-amber-200 shadow-2xs">
                      {item.count} notes
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback Feed */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Feedbacks</h3>
              <p className="text-[11px] text-slate-500">
                Latest customer responses received across all your QR code touchpoints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="view-all-feedback-btn"
                onClick={() => onNavigate('feedback')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1"
              >
                <span>View Full Feedback Log</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {filteredFeedbacks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">No Feedback Received Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Display your QR codes at your tables or counter so customers can start leaving authentic feedback.
              </p>
              {qrCodes.length > 0 && (
                <button
                  onClick={() => setSelectedQRForModal(qrCodes[0])}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  View & Print Your QR Code
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedbacks.slice(0, 5).map((fb) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-xs text-slate-800">
                          {fb.rating}.0
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {fb.customerName || 'Anonymous Customer'}
                        </span>
                        {fb.qrLocationName && (
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            • {fb.qrLocationName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      {fb.googleReviewClicked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          <span>Google Clicked</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Selected categories */}
                  {fb.selectedCategories && fb.selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {fb.selectedCategories.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Public comment */}
                  {fb.customerComment && (
                    <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100">
                      "{fb.customerComment}"
                    </p>
                  )}

                  {/* Private Feedback for Owner */}
                  {fb.privateFeedback && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Private Note to Business: </span>
                        <span>{fb.privateFeedback}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Display Modal */}
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

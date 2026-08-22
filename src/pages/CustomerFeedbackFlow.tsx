import React, { useState, useEffect } from 'react';
import { BusinessProfile, QRCodeItem, ReviewDraft, CustomerFeedback } from '../types';
import { getBusinessBySlug, getBusinessById } from '../services/businessService';
import { getQRCodeById, incrementQRScan } from '../services/qrService';
import { submitCustomerFeedback, recordGoogleReviewClick } from '../services/feedbackService';
import { generateReviewDrafts } from '../services/aiService';
import { getDefaultCategoriesForType, ExperienceCategoryDefinition } from '../utils/categories';
import { DEMO_BUSINESS, DEMO_QR_CODES } from '../utils/demoData';
import { StarRating } from '../components/StarRating';
import { AIReviewOptions } from '../components/AIReviewOptions';
import { LegalNotice } from '../components/LegalNotice';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Store,
  MessageSquare,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  HeartHandshake,
  Check,
} from 'lucide-react';

interface CustomerFeedbackFlowProps {
  businessSlug?: string;
  qrId?: string;
  isDemo?: boolean;
  onFinishedDemo?: () => void;
}

export const CustomerFeedbackFlow: React.FC<CustomerFeedbackFlowProps> = ({
  businessSlug,
  qrId,
  isDemo = false,
  onFinishedDemo,
}) => {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Flow Steps: 1: Rating, 2: Categories, 3: Optional Text & Private, 4: AI Drafts & Google
  const [step, setStep] = useState<number>(1);
  const [previousStep, setPreviousStep] = useState<number>(1);

  // Customer Form State
  const [rating, setRating] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customerComment, setCustomerComment] = useState<string>('');
  const [privateFeedback, setPrivateFeedback] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // AI Review State
  const [generatingDrafts, setGeneratingDrafts] = useState<boolean>(false);
  const [aiDrafts, setAiDrafts] = useState<ReviewDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activeDraftText, setActiveDraftText] = useState<string>('');
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<string | null>(null);

  // Clipboard & Google state
  const [copiedReview, setCopiedReview] = useState<boolean>(false);
  const [googleOpened, setGoogleOpened] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setLoadError(null);

      if (isDemo || businessSlug === 'demo' || businessSlug === 'artisan-roast-cafe') {
        setBusiness(DEMO_BUSINESS);
        setQrCode(DEMO_QR_CODES[0]);
        setLoading(false);
        return;
      }

      try {
        let biz: BusinessProfile | null = null;
        if (businessSlug) {
          biz = await getBusinessBySlug(businessSlug);
        }

        if (!biz && qrId) {
          const qr = await getQRCodeById(qrId);
          if (qr) {
            setQrCode(qr);
            biz = await getBusinessById(qr.businessId);
          }
        }

        if (!biz) {
          setLoadError('Business could not be found or the QR link has expired.');
          setLoading(false);
          return;
        }

        if (biz.status === 'disabled') {
          setLoadError('This business profile is currently inactive.');
          setLoading(false);
          return;
        }

        setBusiness(biz);

        if (qrId) {
          const qr = await getQRCodeById(qrId);
          if (qr) {
            if (!qr.active) {
              setLoadError('This specific QR touchpoint has been disabled by the business.');
              setLoading(false);
              return;
            }
            setQrCode(qr);
            // Non-blocking scan count increment
            incrementQRScan(qr.id);
          }
        }
      } catch (err: any) {
        console.error('Error loading QR business:', err);
        setLoadError('Unable to connect to business feedback service. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [businessSlug, qrId, isDemo]);

  // Categories definition based on business category
  const categoriesList: ExperienceCategoryDefinition[] = business
    ? getDefaultCategoriesForType(business.category)
    : [];

  const handleToggleChip = (chipText: string) => {
    setSelectedChips((prev) =>
      prev.includes(chipText) ? prev.filter((c) => c !== chipText) : [...prev, chipText]
    );
  };

  const handleGenerateAIDrafts = async () => {
    if (!business || rating === 0) return;
    setPreviousStep(step);
    setGeneratingDrafts(true);
    setStep(4);

    try {
      // 1. Submit initial feedback record to Firestore (non-blocking)
      let savedFbId = submittedFeedbackId;
      if (!savedFbId && !isDemo) {
        try {
          const newFb = await submitCustomerFeedback({
            businessId: business.id,
            qrId: qrCode?.id,
            qrLocationName: qrCode?.name || qrCode?.location,
            rating,
            selectedCategories: selectedChips,
            customerComment: customerComment.trim() || undefined,
            privateFeedback: privateFeedback.trim() || undefined,
            customerName: isAnonymous ? undefined : customerName.trim() || undefined,
            isAnonymous,
          });
          savedFbId = newFb.id;
          setSubmittedFeedbackId(newFb.id);
        } catch (e) {
          console.warn('Feedback save warning (proceeding with reviews):', e);
        }
      }

      // 2. Generate 5 Review Drafts
      const res = await generateReviewDrafts({
        businessId: business.id,
        businessName: business.name,
        businessCategory: business.category,
        rating,
        selectedCategories: selectedChips,
        customerComment: customerComment.trim(),
        customerName: isAnonymous ? undefined : customerName.trim(),
      });

      if (res && res.drafts && res.drafts.length > 0) {
        setAiDrafts(res.drafts);
        setSelectedDraftId(res.drafts[0].id);
        setActiveDraftText(res.drafts[0].content);
      }
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const handleSelectDraft = (draft: ReviewDraft) => {
    setSelectedDraftId(draft.id);
    setActiveDraftText(draft.content);
  };

  const handleCopyReview = async () => {
    if (!activeDraftText) return;
    try {
      await navigator.clipboard.writeText(activeDraftText);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 3000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  const handleContinueToGoogle = async () => {
    if (!business) return;

    // 1. Auto-copy draft text to clipboard
    if (activeDraftText) {
      try {
        await navigator.clipboard.writeText(activeDraftText);
        setCopiedReview(true);
      } catch (e) {
        console.warn('Could not auto-copy to clipboard:', e);
      }
    }

    // 2. Record click telemetry
    if (!isDemo && business.id) {
      recordGoogleReviewClick(business.id, submittedFeedbackId || undefined, qrCode?.id);
    }

    // 3. Open Google Review URL
    const googleUrl = business.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(business.name + ' reviews')}`;
    window.open(googleUrl, '_blank');
    setGoogleOpened(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold text-slate-700">Connecting to feedback experience...</span>
      </div>
    );
  }

  // Error State (e.g. Invalid or disabled QR)
  if (loadError || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">QR Touchpoint Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {loadError || 'The requested business review flow is not accessible.'}
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-colors"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-5 px-3 sm:px-6">
      <div className="max-w-xl w-full mx-auto space-y-4">
        {/* Business Branding Card */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-2xs">
                {business.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">
                {business.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <span>{business.category}</span>
                {qrCode && <span>• {qrCode.name}</span>}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
              Step {step} of 4
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* STEP 1: Star Rating (Customer Choice, Never Pre-Selected) */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                How was your experience?
              </h2>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Please rate your visit. You have complete control over your rating.
              </p>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
              <StarRating
                rating={rating}
                onRatingChange={(r) => setRating(r)}
                interactive={true}
                size="xl"
                showLabel={true}
              />
            </div>

            <div className="space-y-2 pt-1">
              {/* Primary Instant AI Review Options */}
              <button
                id="step-1-instant-ai-btn"
                disabled={rating === 0}
                onClick={handleGenerateAIDrafts}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Get 5 AI Review Suggestions Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Secondary Details button */}
              <button
                id="step-1-details-btn"
                disabled={rating === 0}
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Add Specific Details & Tags (Optional)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Category Chips */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">What stood out?</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select any elements that describe your visit (multiple allowed).
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {categoriesList.map((catGroup, idx) => {
                const options = rating >= 4 ? catGroup.positiveOptions : catGroup.constructiveOptions;

                return (
                  <div key={idx} className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      {catGroup.title}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((opt) => {
                        const chipTag = `${catGroup.title}: ${opt}`;
                        const isSelected = selectedChips.includes(chipTag);

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleToggleChip(chipTag)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="step-2-instant-review-btn"
                onClick={handleGenerateAIDrafts}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Get AI Review Suggestions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                id="step-2-continue-btn"
                onClick={() => setStep(3)}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Add Private Notes / Written Comment (Optional)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Optional Written Comment & Private Feedback */}
        {step === 3 && (
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Want to tell us more?</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Optional details help the AI write a personalized review draft.
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Optional experience text */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Experience Highlights (Optional)
                </label>
                <textarea
                  id="customer-comment-input"
                  rows={3}
                  maxLength={500}
                  value={customerComment}
                  onChange={(e) => setCustomerComment(e.target.value)}
                  placeholder="e.g. Loved the iced latte and the croissant was super fresh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {customerComment.length}/500 chars
                </span>
              </div>

              {/* Private note to owner */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Private Note to Business (Will NOT be in public review)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Have a suggestion or private note? Only the business owner sees this on their dashboard.
                </p>
                <textarea
                  id="customer-private-feedback-input"
                  rows={2}
                  value={privateFeedback}
                  onChange={(e) => setPrivateFeedback(e.target.value)}
                  placeholder="e.g. The patio heaters were a bit low today..."
                  className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your First Name (Optional)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    id="customer-name-input"
                    type="text"
                    disabled={isAnonymous}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="First Name only (e.g. Alex)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => {
                        setIsAnonymous(e.target.checked);
                        if (e.target.checked) setCustomerName('');
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Anonymous</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              id="generate-drafts-btn"
              onClick={handleGenerateAIDrafts}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 5 AI Review Suggestions</span>
            </button>
          </div>
        )}

        {/* STEP 4: 5 AI Review Drafts, Edit, & Continue to Google */}
        {step === 4 && (
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            {generatingDrafts ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Creating 5 Authentic Review Variations...
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Crafting Short, Friendly, Detailed, Professional, and Casual styles based only on your input.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h2 className="text-base font-black text-slate-900">Your Review Suggestions</h2>
                    <p className="text-[11px] text-slate-500">
                      Pick your favorite style, edit anything, then copy & continue to Google.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(previousStep || 1)}
                    className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                </div>

                {/* 5 AI Drafts List Component */}
                <AIReviewOptions
                  drafts={aiDrafts}
                  selectedDraftId={selectedDraftId}
                  onSelectDraft={handleSelectDraft}
                  onEditDraftText={(txt) => setActiveDraftText(txt)}
                  activeDraftText={activeDraftText}
                />

                {/* Disclaimer banner */}
                <LegalNotice variant="compact" />

                {/* Google Review Submission Box */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      id="customer-copy-review-btn"
                      type="button"
                      onClick={handleCopyReview}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedReview ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Review Copied ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Review Text</span>
                        </>
                      )}
                    </button>

                    <button
                      id="customer-continue-google-btn"
                      type="button"
                      onClick={handleContinueToGoogle}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Continue to Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {googleOpened && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 text-center animate-in fade-in">
                      <span className="font-bold">Opening Google in a new tab... </span>
                      Please paste your copied review text and click Submit on Google. Thank you for supporting {business.name}!
                    </div>
                  )}

                  {isDemo && (
                    <div className="text-center pt-1">
                      <button
                        onClick={onFinishedDemo}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Return to Demo Dashboard & View Feedbacks →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer minimal info */}
      <div className="max-w-xl mx-auto text-center pt-4 text-[10px] text-slate-400 space-y-0.5">
        <div>Powered by ReviewFlow AI • Authentic Customer Feedback</div>
        <div>You remain 100% in control of your rating and review submission.</div>
      </div>
    </div>
  );
};

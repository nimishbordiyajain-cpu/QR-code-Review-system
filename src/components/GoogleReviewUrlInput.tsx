import React, { useState } from 'react';
import {
  Link as LinkIcon,
  ExternalLink,
  Search,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Compass,
} from 'lucide-react';
import {
  normalizeGoogleReviewUrl,
  isValidUrl,
  buildGoogleMapsSearchUrl,
  SAMPLE_GOOGLE_REVIEW_URLS,
} from '../utils/googleReviewUrlHelper';

interface GoogleReviewUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  businessName?: string;
  address?: string;
  idPrefix?: string;
  required?: boolean;
  onUrlTested?: () => void;
}

export const GoogleReviewUrlInput: React.FC<GoogleReviewUrlInputProps> = ({
  value,
  onChange,
  businessName = '',
  address = '',
  idPrefix = 'onboarding',
  required = true,
  onUrlTested,
}) => {
  const [showHelper, setShowHelper] = useState(false);
  const [placeIdInput, setPlaceIdInput] = useState('');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setTestFeedback(null);
  };

  const handleBlur = () => {
    if (value.trim()) {
      const normalized = normalizeGoogleReviewUrl(value);
      if (normalized !== value) {
        onChange(normalized);
      }
    }
  };

  const handleTestLink = () => {
    if (!value.trim()) {
      setTestFeedback('Please enter or paste a URL first.');
      return;
    }

    const normalized = normalizeGoogleReviewUrl(value);
    if (!isValidUrl(normalized)) {
      setTestFeedback('Please enter a valid web address (e.g., https://g.page/r/.../review)');
      return;
    }

    onChange(normalized);
    window.open(normalized, '_blank', 'noopener,noreferrer');
    setTestFeedback('Link opened in a new tab! Verify that it opens your review dialog.');
    if (onUrlTested) {
      onUrlTested();
    }
  };

  const handleSearchGoogleMaps = () => {
    const searchUrl = buildGoogleMapsSearchUrl(businessName, address);
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConvertPlaceId = () => {
    if (!placeIdInput.trim()) return;
    const normalized = normalizeGoogleReviewUrl(placeIdInput.trim());
    onChange(normalized);
    setPlaceIdInput('');
    setShowHelper(false);
    setTestFeedback('Place ID successfully converted to direct Google Review link!');
  };

  const handleSelectSample = (sampleUrl: string) => {
    onChange(sampleUrl);
    setShowHelper(false);
    setTestFeedback('Sample Google Review URL applied.');
  };

  const isConfigured = Boolean(value && value.trim().length > 5);

  return (
    <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-3.5 space-y-2.5">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <label
              htmlFor={`${idPrefix}-google-url-input`}
              className="text-xs font-bold text-slate-900"
            >
              Google Review URL {required && <span className="text-rose-500">*</span>}
            </label>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            The destination where customers submit their review on Google.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2 py-1 rounded-md shadow-2xs transition-colors shrink-0"
        >
          <HelpCircle className="w-3 h-3 text-indigo-500" />
          <span>Find / Generate Link</span>
          {showHelper ? (
            <ChevronUp className="w-3 h-3 text-indigo-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-indigo-400" />
          )}
        </button>
      </div>

      {/* Input and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
        <div className="relative flex-1">
          <input
            id={`${idPrefix}-google-url-input`}
            type="text"
            inputMode="url"
            autoComplete="url"
            required={required}
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {isConfigured && (
            <div className="absolute right-2 top-1.5 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`${idPrefix}-test-url-btn`}
            type="button"
            onClick={handleTestLink}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1 shrink-0"
            title="Open link in a new tab to verify"
          >
            <span>Test Link</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Realtime Feedback Status */}
      {testFeedback && (
        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200/70 text-[11px] text-indigo-800 flex items-start gap-1.5 animate-in fade-in">
          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
          <span>{testFeedback}</span>
        </div>
      )}

      {/* Interactive Helper Drawer */}
      {showHelper && (
        <div className="mt-2 pt-3 border-t border-indigo-200/60 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Method 1: Google Maps 1-Click Search */}
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Method 1: Find on Google Maps</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Search your business on Google Maps, then click <strong>"Ask for reviews"</strong>{' '}
                or <strong>"Share"</strong> to copy your official link.
              </p>
              <button
                type="button"
                onClick={handleSearchGoogleMaps}
                className="w-full mt-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 flex items-center justify-center gap-1 transition-colors"
              >
                <Search className="w-3 h-3" />
                <span>Search "{businessName || 'My Business'}" on Maps</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Method 2: Convert Google Place ID */}
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Method 2: Convert Place ID</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Have a Google Place ID (e.g. <code>ChIJN1t_tDeu...</code>)? We'll turn it into a direct review URL.
              </p>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={placeIdInput}
                  onChange={(e) => setPlaceIdInput(e.target.value)}
                  placeholder="Paste Place ID (ChIJ...)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleConvertPlaceId}
                  disabled={!placeIdInput.trim()}
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold disabled:opacity-40 transition-colors shrink-0"
                >
                  Convert
                </button>
              </div>
            </div>
          </div>

          {/* Method 3: Sample / Testing Quick Fill */}
          <div className="bg-white rounded-lg p-2.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Testing or exploring?</span> Use a sample review URL to continue immediately:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SAMPLE_GOOGLE_REVIEW_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample.url)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
                >
                  Use {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-step visual instruction */}
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700">How to get your link from Google Business Profile:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 pt-0.5">
              <div>
                <span className="font-bold text-indigo-600">1.</span> Search your business name on Google or Google Maps.
              </div>
              <div>
                <span className="font-bold text-indigo-600">2.</span> Click the <strong>"Ask for reviews"</strong> button.
              </div>
              <div>
                <span className="font-bold text-indigo-600">3.</span> Copy the short URL and paste it into the box above.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

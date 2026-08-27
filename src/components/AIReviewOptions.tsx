import React, { useState } from 'react';
import { ReviewDraft } from '../types';
import { Sparkles, Check, Copy, Edit3 } from 'lucide-react';

interface AIReviewOptionsProps {
  drafts: ReviewDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (draft: ReviewDraft) => void;
  onEditDraftText: (newText: string) => void;
  activeDraftText: string;
}

const STYLE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Short & Simple': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
  'Friendly & Natural': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Detailed': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  'Professional': { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  'Casual': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
};

export const AIReviewOptions: React.FC<AIReviewOptionsProps> = ({
  drafts,
  selectedDraftId,
  onSelectDraft,
  onEditDraftText,
  activeDraftText,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySingle = async (e: React.MouseEvent, draft: ReviewDraft) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopiedId(draft.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <span>Synthesized Review Options (Select One)</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          Grounded on your experience
        </span>
      </div>

      <div className="space-y-2">
        {drafts.map((draft, idx) => {
          const isSelected = selectedDraftId === draft.id;
          const badge = STYLE_BADGES[draft.style] || {
            bg: 'bg-slate-100',
            text: 'text-slate-700',
            border: 'border-slate-200',
          };

          return (
            <div
              key={draft.id || idx}
              id={`draft-option-${draft.id || idx}`}
              onClick={() => onSelectDraft(draft)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600/30 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {draft.style}
                  </span>
                  {draft.description && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {draft.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleCopySingle(e, draft)}
                    title="Quick Copy"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  >
                    {copiedId === draft.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                "{isSelected ? activeDraftText : draft.content}"
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Edit Box for Chosen Draft */}
      {selectedDraftId && (
        <div className="mt-3 bg-slate-50 border border-blue-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Customize Selected Review:</span>
            </div>
            <span className="text-[10px] text-slate-400">Edit freely before copying</span>
          </div>

          <textarea
            id="selected-review-editor-input"
            value={activeDraftText}
            onChange={(e) => onEditDraftText(e.target.value)}
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Edit review text here..."
          />
        </div>
      )}
    </div>
  );
};

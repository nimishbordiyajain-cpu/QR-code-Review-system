import React, { useState } from 'react';
import { ReviewDraft } from '../types';
import { Sparkles, Check, Copy, Edit3, MessageSquareText } from 'lucide-react';

interface AIReviewOptionsProps {
  drafts: ReviewDraft[];
  selectedDraftId: string | null;
  onSelectDraft: (draft: ReviewDraft) => void;
  onEditDraftText: (newText: string) => void;
  activeDraftText: string;
}

const STYLE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Short & Simple': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Friendly & Natural': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Detailed': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Professional': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Casual': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
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
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>5 AI Review Suggestions (Pick One)</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">
          Based only on your input
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
              className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500/30 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {draft.style}
                  </span>
                  {draft.description && (
                    <span className="text-[10px] text-slate-400 font-medium">
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
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
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
        <div className="mt-3 bg-slate-50 border border-indigo-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Edit3 className="w-3 h-3 text-indigo-600" />
              <span>Edit Your Selected Review:</span>
            </div>
            <span className="text-[10px] text-slate-400">Feel free to personalize</span>
          </div>

          <textarea
            id="selected-review-editor-input"
            value={activeDraftText}
            onChange={(e) => onEditDraftText(e.target.value)}
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Edit review text here..."
          />
        </div>
      )}
    </div>
  );
};

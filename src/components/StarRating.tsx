import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor / Disappointing',
  2: 'Could be better',
  3: 'Average / Neutral',
  4: 'Good experience',
  5: 'Exceptional experience!',
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
  showLabel = false,
}) => {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  const activeRating = hoveredRating !== null ? hoveredRating : rating;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1.5 focus:outline-none"
        role={interactive ? 'radiogroup' : undefined}
        aria-label="Star rating"
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= activeRating;
          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoveredRating(starValue)}
              onMouseLeave={() => interactive && setHoveredRating(null)}
              className={`transition-transform focus:outline-none ${
                interactive
                  ? 'cursor-pointer hover:scale-115 active:scale-95 p-1 -m-1 focus-visible:ring-2 focus-visible:ring-amber-500 rounded-full'
                  : 'cursor-default'
              }`}
              aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && activeRating > 0 && (
        <span className="text-sm font-semibold text-slate-700 transition-all duration-150">
          {RATING_LABELS[activeRating]}
        </span>
      )}
    </div>
  );
};

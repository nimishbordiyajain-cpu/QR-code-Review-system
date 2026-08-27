import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  subtitle?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'light',
  subtitle,
  className = '',
}) => {
  const isDark = theme === 'dark';

  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }[size];

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size];

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Monogram (R + Flow Vector + Verification Star) */}
      <div
        className={`${iconDimensions} shrink-0 rounded-xl flex items-center justify-center relative overflow-hidden shadow-xs transition-transform duration-200 group-hover:scale-105 ${
          isDark
            ? 'bg-blue-600 text-white border border-blue-400/40 shadow-blue-900/30'
            : 'bg-slate-900 text-white border border-slate-800 shadow-slate-900/10'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5/6 h-5/6"
        >
          {/* Subtle Dynamic Arc / Feedback Loop */}
          <path
            d="M5 16C5 9.92487 9.92487 5 16 5"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />

          {/* Bold Letter 'R' Spine & Top Loop */}
          <path
            d="M9 24V8C9 7.44772 9.44772 7 10 7H16.5C19.5376 7 22 9.46243 22 12.5C22 15.5376 19.5376 18 16.5 18H9.5"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dynamic Review Velocity Forward Leg */}
          <path
            d="M15 18L23 25"
            stroke={isDark ? '#93C5FD' : '#3B82F6'}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 5-Star Verification Accent Dot */}
          <circle
            cx="24"
            cy="8.5"
            r="2.25"
            fill="#10B981"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              } ${titleSizes}`}
            >
              Review
              <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                Flow
              </span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                isDark
                  ? 'bg-slate-800/80 text-blue-300 border-slate-700'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              PRO
            </span>
          </div>
          {subtitle && (
            <span
              className={`font-medium tracking-wide uppercase mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              } ${subSizes}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

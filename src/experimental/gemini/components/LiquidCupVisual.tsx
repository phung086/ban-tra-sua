import React from 'react';

export type TeaBaseKind = 'black_tea' | 'green_tea' | 'milk_tea' | 'fruit_tea';

export interface LiquidCupVisualProps {
  fillRatio: number; // 0.0 to 1.0
  teaBase?: TeaBaseKind;
  toppings?: string[];
  isSealed?: boolean;
  isPouring?: boolean;
  className?: string;
}

const TEA_COLORS: Record<TeaBaseKind, { top: string; bottom: string }> = {
  black_tea: { top: '#b06a3b', bottom: '#7a3e1d' },
  green_tea: { top: '#74a872', bottom: '#4d7c4b' },
  milk_tea: { top: '#d4a373', bottom: '#a67c52' },
  fruit_tea: { top: '#f28482', bottom: '#d85a58' },
};

export const LiquidCupVisual: React.FC<LiquidCupVisualProps> = ({
  fillRatio,
  teaBase = 'milk_tea',
  toppings = [],
  isSealed = false,
  isPouring = false,
  className = '',
}) => {
  const clampedFill = Math.max(0, Math.min(1, fillRatio));
  const colors = TEA_COLORS[teaBase] ?? TEA_COLORS.milk_tea;
  const liquidHeight = clampedFill * 110;
  const liquidY = 135 - liquidHeight;

  const hasBoba = toppings.some((t) => t.includes('boba') || t.includes('trân châu'));
  const hasJelly = toppings.some((t) => t.includes('jelly') || t.includes('thạch'));
  const hasPudding = toppings.some((t) => t.includes('pudding'));

  return (
    <div
      className={`liquid-cup-container ${className}`}
      role="img"
      aria-label={`Ly trà sữa ${Math.round(clampedFill * 100)}% đầy`}
    >
      <svg
        viewBox="0 0 100 150"
        className="liquid-cup-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="teaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.top} />
            <stop offset="100%" stopColor={colors.bottom} />
          </linearGradient>
          <clipPath id="cupClip">
            <path d="M 22 25 L 28 135 C 28 140 72 140 72 135 L 78 25 Z" />
          </clipPath>
        </defs>

        {/* Cup outline & shadow */}
        <path
          d="M 22 25 L 28 135 C 28 140 72 140 72 135 L 78 25 Z"
          fill="#ffffff"
          fillOpacity="0.32"
          stroke="#ddb892"
          strokeWidth="2.5"
        />

        {/* Liquid body */}
        <g clipPath="url(#cupClip)">
          {clampedFill > 0 && (
            <>
              <rect
                x="15"
                y={liquidY}
                width="70"
                height={liquidHeight + 10}
                fill="url(#teaGradient)"
              />
              {/* Surface ripple */}
              <ellipse
                cx="50"
                cy={liquidY}
                rx="25"
                ry={isPouring ? 4.5 : 2.5}
                fill={colors.top}
                opacity="0.9"
              />
            </>
          )}

          {/* Boba pearls layer at bottom */}
          {hasBoba && clampedFill > 0.05 && (
            <g fill="#1a1412" opacity="0.95">
              <circle cx="36" cy="130" r="3.8" />
              <circle cx="45" cy="132" r="4.0" />
              <circle cx="55" cy="131" r="3.9" />
              <circle cx="64" cy="129" r="3.7" />
              <circle cx="41" cy="124" r="3.6" />
              <circle cx="50" cy="123" r="3.8" />
              <circle cx="59" cy="124" r="3.7" />
            </g>
          )}

          {/* Coconut jelly cubes */}
          {hasJelly && clampedFill > 0.05 && (
            <g fill="#ffffff" opacity="0.75" stroke="#e0e0e0" strokeWidth="0.5">
              <rect x="34" y="118" width="6" height="6" rx="1" />
              <rect x="46" y="116" width="6.5" height="6.5" rx="1" />
              <rect x="58" y="117" width="6" height="6" rx="1" />
            </g>
          )}

          {/* Pudding wobble slice */}
          {hasPudding && clampedFill > 0.05 && (
            <ellipse cx="50" cy="122" rx="16" ry="6" fill="#f4d06f" opacity="0.9" />
          )}

          {/* Floating ice cubes */}
          {clampedFill > 0.25 && (
            <g fill="#ffffff" opacity="0.48" stroke="#e6f2ff" strokeWidth="0.8">
              <rect x="36" y={Math.max(35, liquidY + 6)} width="11" height="11" rx="2" />
              <rect x="52" y={Math.max(38, liquidY + 8)} width="10" height="10" rx="2" />
            </g>
          )}
        </g>

        {/* Cup rim */}
        <ellipse
          cx="50"
          cy="25"
          rx="28"
          ry="4"
          fill="none"
          stroke="#b08968"
          strokeWidth="2.5"
        />

        {/* Sealed plastic film cover */}
        {isSealed && (
          <ellipse
            cx="50"
            cy="25"
            rx="27"
            ry="4"
            fill="#d90429"
            fillOpacity="0.75"
            stroke="#9b2226"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <div className="liquid-cup-meta">
        <small className="liquid-fill-text">{Math.round(clampedFill * 100)}%</small>
        {isSealed && <span className="sealed-badge">Đã dập nắp</span>}
      </div>
    </div>
  );
};

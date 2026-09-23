import React from 'react';

interface CropNomicsLogoProps {
  size?: 'header' | 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const CropNomicsLogo: React.FC<CropNomicsLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'light',
}) => {
  const isHeader = size === 'header';
  const isSm = size === 'sm';
  const isMd = size === 'md';
  const isLg = size === 'lg';
  const isHero = size === 'hero';

  // Scale dimensions for the SVG emblem
  const svgWidth = isHeader || isSm ? 120 : isMd ? 180 : isLg ? 240 : 300;
  const svgHeight = isHeader || isSm ? 54 : isMd ? 80 : isLg ? 108 : 135;

  const textSize = isHeader || isSm
    ? 'text-lg sm:text-xl'
    : isMd
    ? 'text-2xl sm:text-3xl'
    : isLg
    ? 'text-3xl sm:text-4xl'
    : 'text-4xl sm:text-5xl md:text-6xl';

  const taglineSize = isHeader || isSm
    ? 'text-[8px] sm:text-[9px] tracking-[0.18em]'
    : isMd
    ? 'text-[10px] sm:text-[11px] tracking-[0.2em]'
    : isLg
    ? 'text-xs tracking-[0.22em]'
    : 'text-xs sm:text-sm md:text-base tracking-[0.24em]';

  const greenColor = variant === 'dark' ? '#34d399' : '#0b5229';
  const greenDiamondFill = variant === 'dark' ? '#064e26' : '#14532d';
  const amberColor = '#c06a1c';
  const copperColor = variant === 'dark' ? '#fb923c' : '#c06a1c';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Exact SVG Emblem based on the uploaded logo */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 340 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="CropNomics Supply Chain Balance Emblem"
      >
        <defs>
          {/* Subtle copper gradient */}
          <linearGradient id="copperGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Green diamond gradient */}
          <linearGradient id="greenNodeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#0f4625" />
          </linearGradient>

          {/* Amber icon gradient */}
          <linearGradient id="amberIconGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* --- Connecting Arched Bridge / Scale Arms --- */}
        {/* Arm 1: Left Node to Top-Left Node */}
        <path
          d="M 68 85 Q 92 68, 120 50"
          stroke="url(#copperGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Arm 2: Top-Left Node to Center Top Arch */}
        <path
          d="M 148 40 Q 170 30, 192 40"
          stroke="url(#copperGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Central Balance Pivot Loop / Arch */}
        <path
          d="M 152 46 C 158 75, 182 75, 188 46"
          stroke="url(#copperGrad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arm 3: Top-Right Node to Right Node */}
        <path
          d="M 220 50 Q 248 68, 272 85"
          stroke="url(#copperGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* --- Central Fulcrum / Pivot Stand (Green Triangle) --- */}
        <polygon
          points="170,82 155,116 185,116"
          fill="none"
          stroke={variant === 'dark' ? '#34d399' : '#0f5128'}
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* --- Node 1: Far Left (Farmer / Plant Sprout) --- */}
        <g transform="translate(68, 85) rotate(45)">
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            rx="8"
            fill="url(#greenNodeGrad)"
            stroke={variant === 'dark' ? '#34d399' : '#166534'}
            strokeWidth="1.5"
          />
        </g>
        {/* Plant Icon inside Node 1 */}
        <g transform="translate(68, 85)">
          <path
            d="M 0 11 Q 0 -2, 7 -7 Q 4 -12, -2 -11 Q -9 -11, -7 -3 Q 0 4, 0 11"
            fill="url(#amberIconGrad)"
          />
          <path
            d="M 0 3 Q -7 -2, -10 -9 Q -5 -11, 0 -5"
            fill="url(#amberIconGrad)"
          />
          <path
            d="M -9 11 Q 0 8, 9 11"
            stroke="url(#amberIconGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* --- Node 2: Top Left (Logistics / Delivery Truck) --- */}
        <g transform="translate(134, 42) rotate(45)">
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            rx="8"
            fill="url(#greenNodeGrad)"
            stroke={variant === 'dark' ? '#34d399' : '#166534'}
            strokeWidth="1.5"
          />
        </g>
        {/* Delivery Truck Icon inside Node 2 */}
        <g transform="translate(134, 42)">
          {/* Truck Body */}
          <rect x="-11" y="-8" width="14" height="11" rx="1" fill="url(#amberIconGrad)" />
          <path d="M 3 -3 L 8 -3 L 11 1 L 11 3 L 3 3 Z" fill="url(#amberIconGrad)" />
          {/* Wheels */}
          <circle cx="-6" cy="5" r="2.5" fill="#14532d" stroke="url(#amberIconGrad)" strokeWidth="1.5" />
          <circle cx="7" cy="5" r="2.5" fill="#14532d" stroke="url(#amberIconGrad)" strokeWidth="1.5" />
        </g>

        {/* --- Node 3: Top Right (Wholesale / Storefront) --- */}
        <g transform="translate(206, 42) rotate(45)">
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            rx="8"
            fill="url(#greenNodeGrad)"
            stroke={variant === 'dark' ? '#34d399' : '#166534'}
            strokeWidth="1.5"
          />
        </g>
        {/* Storefront Icon inside Node 3 */}
        <g transform="translate(206, 42)">
          {/* Awning */}
          <path d="M -10 -7 Q -5 -9, 0 -7 Q 5 -9, 10 -7 L 8 -2 L -8 -2 Z" fill="url(#amberIconGrad)" />
          {/* Pillars & Base */}
          <rect x="-8" y="-1" width="3" height="8" fill="url(#amberIconGrad)" />
          <rect x="5" y="-1" width="3" height="8" fill="url(#amberIconGrad)" />
          <rect x="-10" y="7" width="20" height="2" rx="1" fill="url(#amberIconGrad)" />
        </g>

        {/* --- Node 4: Far Right (Retail / Shopping Bag) --- */}
        <g transform="translate(272, 85) rotate(45)">
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            rx="8"
            fill="url(#greenNodeGrad)"
            stroke={variant === 'dark' ? '#34d399' : '#166534'}
            strokeWidth="1.5"
          />
        </g>
        {/* Shopping Bag Icon inside Node 4 */}
        <g transform="translate(272, 85)">
          {/* Bag Body */}
          <path
            d="M -7 -2 L -9 9 L 9 9 L 7 -2 Z"
            fill="url(#amberIconGrad)"
          />
          {/* Handle */}
          <path
            d="M -4 -2 C -4 -7, 4 -7, 4 -2"
            fill="none"
            stroke="url(#amberIconGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* --- Main Wordmark Typography --- */}
      <div className="flex items-baseline justify-center tracking-tight font-black mt-1">
        <span
          className={`font-black ${
            variant === 'dark' ? 'text-[#34d399]' : 'text-[#0b5229]'
          } ${textSize}`}
          style={{ letterSpacing: '-0.035em' }}
        >
          Crop
        </span>
        <span
          className={`font-black text-[#c06a1c] ${textSize}`}
          style={{ letterSpacing: '-0.035em' }}
        >
          Nomics
        </span>
      </div>

      {/* --- Exact Tagline --- */}
      {showTagline && (
        <div
          className={`font-black uppercase text-center mt-1 font-sans ${taglineSize} ${
            variant === 'dark' ? 'text-slate-300' : 'text-slate-900'
          }`}
        >
          OPTIMIZING THE MARGINAL SUPPLY CHAIN
        </div>
      )}
    </div>
  );
};

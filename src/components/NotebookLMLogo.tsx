import React from 'react';

interface NotebookLMLogoProps {
  className?: string;
}

export default function NotebookLMLogo({ className = "w-8 h-8" }: NotebookLMLogoProps) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Premium dark teal rounded container base */}
      <rect width="120" height="120" rx="30" fill="#004D40" />
      
      {/* Subtle modern inner gradient background highlight to emphasize depth */}
      <rect x="8" y="8" width="104" height="104" rx="24" fill="url(#logoInnerHighlight)" opacity="0.12" />
      
      {/* Stacked sheets layout matching Google's branded visual flow */}
      <g filter="url(#premiumDropShadow)">
        {/* Layer 1: Warm Pastel Yellow Sheet */}
        <path d="M44 32H78C82 32 85 35 85 39V80H44V32Z" fill="#FFE082" />
        
        {/* Layer 2: Pastel Teal/Mint Sheet offset slightly */}
        <path d="M39 37H73C77 37 80 40 80 44V80H39V37Z" fill="#80CBC4" />
        
        {/* Layer 3: Ultra Clean Off-White core active Document Page */}
        <path d="M34 42H68C72 42 75 45 75 49V80H34V42Z" fill="#FFFFFF" />
      </g>
      
      {/* Inside detail: Grounded text paragraph representation */}
      <rect x="42" y="52" width="22" height="2.5" rx="1.25" fill="#004D40" opacity="0.45" />
      <rect x="42" y="59" width="22" height="2.5" rx="1.25" fill="#004D40" opacity="0.45" />
      <rect x="42" y="66" width="16" height="2.5" rx="1.25" fill="#004D40" opacity="0.45" />
      
      {/* Gradient & shadow definitions */}
      <defs>
        <linearGradient id="logoInnerHighlight" x1="8" y1="8" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#004D40" stopOpacity="0" />
        </linearGradient>
        <filter id="premiumDropShadow" x="26" y="27" width="67" height="63" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3.5" />
          <feGaussianBlur stdDeviation="3.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.28 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}
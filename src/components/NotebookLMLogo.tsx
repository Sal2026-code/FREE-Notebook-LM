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
      {/* Premium dark rounded base */}
      <rect width="120" height="120" rx="32" fill="#004D40" />
      
      {/* Decorative inner gradient background highlight */}
      <rect x="12" y="12" width="96" height="96" rx="22" fill="url(#logoGrad)" opacity="0.15" />
      
      {/* Stylized layered book pages representing AI grounding context */}
      <g filter="url(#shadowFilter)">
        {/* Layered sheet 1: Yellow */}
        <path d="M42 34H78C82.4183 34 86 37.5817 86 42V84H42V34Z" fill="#FFD54F" />
        
        {/* Layered sheet 2: Mint Green */}
        <path d="M38 38H72C76.4183 38 80 41.5817 80 46V84H38V38Z" fill="#4DB6AC" />
        
        {/* Layered sheet 3: Premium Off-White Page */}
        <path d="M34 42H66C70.4183 42 74 45.5817 74 50V84H34V42Z" fill="#FFFFFF" />
      </g>
      
      {/* Structured lines within the core page context */}
      <rect x="42" y="52" width="22" height="3" rx="1.5" fill="#004D40" opacity="0.6" />
      <rect x="42" y="60" width="22" height="3" rx="1.5" fill="#004D40" opacity="0.6" />
      <rect x="42" y="68" width="16" height="3" rx="1.5" fill="#004D40" opacity="0.6" />
      
      {/* Definitions for gradients & high-end drop shadow filters */}
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#004D40" stopOpacity="0" />
        </linearGradient>
        <filter id="shadowFilter" x="28" y="30" width="64" height="60" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}
import React from 'react';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="50" fill="black" />
      <g stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {/* Document */}
        <path d="M 35 25 H 65 V 75 H 35 Z" fill="none" />
        {/* Lines on document */}
        <path d="M 42 35 H 58 M 42 45 H 58 M 42 55 H 50" fill="none" />
        {/* Magnifying Glass */}
        <circle cx="58" cy="58" r="14" fill="none" />
        <line x1="69" y1="69" x2="82" y2="82" />
      </g>
    </svg>
  );
};
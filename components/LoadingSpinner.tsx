import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="w-12 h-12 animate-[m3-spinner-rotate_1.4s_linear_infinite]">
        <svg className="w-full h-full" viewBox="0 0 48 48" aria-hidden="true">
          <circle
            className="animate-[m3-spinner-arc_1.4s_ease-in-out_infinite]"
            cx="24"
            cy="24"
            r="20"
            fill="none"
            strokeWidth="4"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-[var(--color-on-surface-variant)] font-semibold">{message}</p>
    </div>
  );
};
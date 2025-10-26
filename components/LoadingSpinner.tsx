import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-12 h-12 border-4 border-t-4 border-black/20 border-t-black rounded-full animate-spin"></div>
      <p className="text-black/80 font-semibold">{message}</p>
    </div>
  );
};
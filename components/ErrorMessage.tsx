import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-[var(--color-error-container)]/50 border-l-4 border-[var(--color-error)] text-[var(--color-error)] p-4 my-4 rounded-r-lg" role="alert">
      <p className="font-bold">Error</p>
      <pre className="whitespace-pre-wrap font-sans">{message}</pre>
    </div>
  );
};
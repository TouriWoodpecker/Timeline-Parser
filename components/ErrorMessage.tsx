import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-900 p-4 my-4" role="alert">
      <p className="font-bold">Error</p>
      <p>{message}</p>
    </div>
  );
};
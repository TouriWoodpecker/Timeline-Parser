import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div style={{
      backgroundColor: 'var(--md-sys-color-error-container)',
      color: 'var(--md-sys-color-on-error-container)',
      padding: '16px',
      margin: '16px 0',
      borderRadius: '8px',
      border: '1px solid var(--md-sys-color-error)'
    }}>
      <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Error</p>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{message}</pre>
    </div>
  );
};
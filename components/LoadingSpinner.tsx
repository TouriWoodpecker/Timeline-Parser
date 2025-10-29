import React from 'react';
// FIX: Import types for custom element definitions.
import '../types';

interface LoadingIndicatorProps {
  message: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      <p className="md-typescale-body-large" style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', margin: 0, marginBottom: '16px' }}>{message}</p>
      <md-linear-progress indeterminate></md-linear-progress>
    </div>
  );
};
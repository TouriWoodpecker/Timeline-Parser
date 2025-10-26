import React from 'react';
import { LogoIcon } from './LogoIcon';

export const PageTitle: React.FC = () => {
  return (
    <div className="mb-16 flex items-center gap-6">
        <LogoIcon className="h-16 w-16 flex-shrink-0" />
        <div>
          <h1 className="text-5xl font-bold text-[var(--color-on-background)]">Protocol Timeline Parser</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2 text-lg">
            parcing, structuring, analyzing.
          </p>
        </div>
    </div>
  );
};

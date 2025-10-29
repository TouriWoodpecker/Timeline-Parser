import React, { forwardRef } from 'react';
import { LogoIcon } from './LogoIcon';

export const PageTitle = forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px', paddingTop: '32px' }}>
        <LogoIcon style={{ height: '3.0rem', width: '3.0rem', flexShrink: 0 }} />
        <div>
          <h1 className="md-typescale-display-medium" style={{ margin: 0 }}>Protocol Parser</h1>
        </div>
    </div>
  );
});
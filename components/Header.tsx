import React, { forwardRef } from 'react';
import { LogoIcon } from './LogoIcon';

interface HeaderProps {
  isVisible: boolean;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(({ isVisible }, ref) => {
  return (
    <header ref={ref} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: 'var(--md-sys-color-surface-container-low)',
      zIndex: 100,
      boxSizing: 'border-box',
      transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      pointerEvents: isVisible ? 'auto' : 'none',
      // Create a soft fade-out effect at the bottom instead of a hard shadow
      WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
      maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
        <LogoIcon style={{ height: '1.75rem', width: '1.75rem', flexShrink: 0 }} />
        <span className="md-typescale-title-large" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Protocol Parser</span>
      </div>
    </header>
  );
});
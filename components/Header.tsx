import React, { forwardRef } from 'react';
import { LogoIcon } from './LogoIcon';
import { ThemeToggleButton } from './ThemeToggleButton';

interface HeaderProps {
  isVisible: boolean;
  message: string;
  isLoading: boolean;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(({ 
  isVisible, 
  message, 
  isLoading, 
}, ref) => {
  
  const title = "IPEA";

  return (
    <header ref={ref} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--md-sys-color-surface-container-low)',
      zIndex: 100,
      boxSizing: 'border-box',
      transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      pointerEvents: isVisible ? 'auto' : 'none',
      borderBottom: '1px solid var(--md-sys-color-outline-variant)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', width: '100%', boxSizing: 'border-box', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <LogoIcon style={{ height: '1.75rem', width: '1.75rem' }} />
          <span className="md-typescale-title-large" style={{ whiteSpace: 'nowrap' }}>{title}</span>
        </div>
        <div style={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          minWidth: 0,
        }}>
          {isLoading && (
            <md-circular-progress 
              indeterminate 
              style={{ '--md-circular-progress-size': '24px', flexShrink: 0 } as React.CSSProperties} 
              aria-label="Loading..."
            />
          )}
          <span className="md-typescale-title-medium" style={{
            color: 'var(--md-sys-color-on-surface-variant)',
            opacity: message ? 1 : 0,
            transition: 'opacity 300ms ease-in-out',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {message}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}>
            <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
});

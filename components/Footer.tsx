import React from 'react';

interface FooterProps {
  view: 'app' | 'toolbox';
  toolboxView: 'landing' | 'tools';
  activeTabIndex: number;
  onTabSelect: (index: number) => void;
  onGoHome: () => void;
}

const tabs = [
    { label: 'OCR', icon: 'document_scanner' },
    { label: 'Parser', icon: 'mediation' },
    { label: 'Home', icon: 'home' },
    { label: 'Analyze', icon: 'science' },
    { label: 'Insights', icon: 'insights' }
];

export const Footer: React.FC<FooterProps> = ({ view, toolboxView, activeTabIndex, onTabSelect, onGoHome }) => {
    
    const isVisible = view === 'toolbox';

    const handleTabClick = (index: number) => {
        // The middle button (index 2) is "Home"
        if (index === 2) {
            onGoHome();
        } else {
            onTabSelect(index);
        }
    };

    // If we are on the landing page, the "Home" button is active (index 2).
    // Otherwise, the activeTabIndex determines the active button.
    const displayIndex = toolboxView === 'landing' ? 2 : activeTabIndex;

    return (
        <footer style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            display: isVisible ? 'flex' : 'none',
            justifyContent: 'space-around',
            alignItems: 'stretch', // Make items fill height
            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
            zIndex: 100
        }}>
            {tabs.map((tab, index) => {
                const isActive = index === displayIndex;
                // FIX: Cast style object to React.CSSProperties to allow for custom CSS properties.
                const buttonStyle = {
                    borderTop: `2px solid ${isActive ? 'var(--md-sys-color-primary)' : 'transparent'}`,
                    color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                    '--md-text-button-label-text-color': isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                    '--md-text-button-with-icon-icon-color': isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                } as React.CSSProperties;
                
                return (
                    <md-text-button
                        key={tab.label}
                        className="footer-nav-button"
                        onClick={() => handleTabClick(index)}
                        style={buttonStyle}
                        title={tab.label}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined">{tab.icon}</span>
                            <span className="md-typescale-label-medium">{tab.label}</span>
                        </div>
                    </md-text-button>
                );
            })}
        </footer>
    );
};
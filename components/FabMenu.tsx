import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
// FIX: Import types for custom element definitions.
import '../types';

interface FabMenuProps {
    view: 'app' | 'toolbox';
    onToggleView: () => void;
}

export const FabMenu: React.FC<FabMenuProps> = ({ view, onToggleView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const menuRef = useRef<HTMLDivElement>(null);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // Click outside effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    setIsOpen(false);
  };
  
  const handleToggleView = () => {
    onToggleView();
    setIsOpen(false);
  };

  const isDark = theme === 'dark';
  const themeLabel = isDark ? 'Light Mode' : 'Dark Mode';
  const themeIcon = isDark ? 'light_mode' : 'dark_mode';

  const viewLabel = view === 'app' ? 'Switch to IPEA Toolbox' : 'Switch to Protocol Parser';
  const viewIcon = view === 'app' ? 'construction' : 'dynamic_feed';

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '16px',
  };

  const menuItemsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '16px',
  };

  return (
    <div style={containerStyle} ref={menuRef}>
        {isOpen && (
            <div style={menuItemsContainerStyle}>
                <md-fab size="small" aria-label={viewLabel} onClick={handleToggleView}>
                    <span className="material-symbols-outlined" slot="icon">{viewIcon}</span>
                </md-fab>
                <md-fab size="small" aria-label={themeLabel} onClick={toggleTheme}>
                    <span className="material-symbols-outlined" slot="icon">{themeIcon}</span>
                </md-fab>
                <md-fab size="small" aria-label="Scroll to top" onClick={scrollToTop}>
                    <span className="material-symbols-outlined" slot="icon">arrow_upward</span>
                </md-fab>
            </div>
        )}
        <md-fab variant="primary" onClick={toggleMenu} aria-label="Open menu">
            <span className="material-symbols-outlined" slot="icon">
                {isOpen ? 'close' : 'more_vert'}
            </span>
        </md-fab>
    </div>
  );
};
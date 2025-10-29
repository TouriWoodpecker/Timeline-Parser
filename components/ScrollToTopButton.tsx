import React, { useState, useEffect } from 'react';
// FIX: Import types for custom element definitions.
import '../types';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, transition: 'opacity 0.3s, transform 0.3s', opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.5)', pointerEvents: isVisible ? 'auto' : 'none' }}>
      <md-fab variant="primary" onClick={scrollToTop} aria-label="Scroll to top">
        <span className="material-symbols-outlined" slot="icon">arrow_upward</span>
      </md-fab>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { LogoIcon } from './LogoIcon';
import { ThemeToggleButton } from './ThemeToggleButton';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Effect to prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);


  const navLinks = [
    { href: '#input', label: 'Input' },
    { href: '#output', label: 'Output' },
  ];

  const handleMobileLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-lg border-b border-[var(--color-outline)]/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <a 
                href="#root" 
                onClick={() => isMenuOpen && setIsMenuOpen(false)} 
                className="flex items-center gap-3 text-xl lg:text-2xl font-bold text-[var(--color-on-surface)]"
              >
                <LogoIcon className="h-8 w-8" />
                <span>Protocol Parser</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
               <ThemeToggleButton theme={theme} onClick={onToggleTheme} />
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
               <ThemeToggleButton theme={theme} onClick={onToggleTheme} />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
                className="p-2 rounded-full text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  // Close Icon (X)
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger Icon
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-[var(--color-surface)] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        id="mobile-menu"
      >
        <div className="pt-24 px-4 h-full">
          <nav className="flex flex-col items-center justify-start mt-12 gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-2xl font-semibold text-[var(--color-on-surface)]"
                onClick={(e) => handleMobileLinkClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};
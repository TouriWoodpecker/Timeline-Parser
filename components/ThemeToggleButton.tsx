import React, { useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
// FIX: Import types for custom element definitions.
import '../types';

export const ThemeToggleButton: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Light Mode' : 'Dark Mode';
  const icon = isDark ? 'light_mode' : 'dark_mode';

  return (
    <md-filled-tonal-button onClick={toggleTheme} aria-label="Toggle theme">
      <span className="material-symbols-outlined" slot="icon">
        {icon}
      </span>
      {label}
    </md-filled-tonal-button>
  );
};
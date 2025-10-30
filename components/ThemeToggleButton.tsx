import React, { useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const ThemeToggleButton: React.FC = () => {
    // Default to the user's system preference if no theme has been manually set.
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', systemPrefersDark ? 'dark' : 'light');

    // Effect to apply the theme class to the document body whenever the theme changes.
    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <md-filled-tonal-icon-button 
            onClick={handleToggleTheme} 
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span className="material-symbols-outlined">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
        </md-filled-tonal-icon-button>
    );
};

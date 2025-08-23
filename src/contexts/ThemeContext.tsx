import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void; setThemeExplicit: (t: Theme) => void; };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const seeded = (window as any).__theme;
    if (seeded === 'light' || seeded === 'dark') return seeded;

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
        localStorage.setItem('theme', theme);
        (window as any).__theme = theme;
        window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
    }, [theme]);

    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') return;

        const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    const setThemeExplicit = (t: Theme) => setTheme(t);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setThemeExplicit }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/**
 * theme: 'light' | 'dark' | 'system'
 */
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark'); // por defecto dark

    // Lee desde localStorage o sistema
    useEffect(() => {
        const stored = window.localStorage.getItem('erp_theme');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setTheme(stored);
        } else {
            setTheme('dark');
        }
    }, []);

    // Aplica el tema al <html> y guarda en localStorage
    useEffect(() => {
        const root = document.documentElement;

        const apply = (mode) => {
            if (mode === 'dark') {
                root.classList.add('dark');
            } else if (mode === 'light') {
                root.classList.remove('dark');
            } else {
                // 'system': según preferencia del SO
                const prefersDark = window.matchMedia &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        apply(theme);
        window.localStorage.setItem('erp_theme', theme);

    }, [theme]);

    const value = {
        theme,
        setTheme,
        toggleTheme: () => {
            setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        },
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme debe usarse dentro de ThemeProvider');
    }
    return ctx;
};

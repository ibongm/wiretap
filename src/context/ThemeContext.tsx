import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '@/types/wiretap';

export type ThemeMode = 'oled' | 'slate' | 'editorial' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{
  initialTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  children: React.ReactNode;
}> = ({ initialTheme = 'slate', onThemeChange, children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    if (initialTheme && initialTheme !== theme) {
      setThemeState(initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-oled', 'theme-slate', 'theme-editorial', 'theme-light', 'dark', 'light');

    if (theme === 'oled') {
      root.classList.add('theme-oled', 'dark');
      root.style.backgroundColor = '#000000';
    } else if (theme === 'slate') {
      root.classList.add('theme-slate', 'dark');
      root.style.backgroundColor = '#0F172A';
    } else if (theme === 'editorial') {
      root.classList.add('theme-editorial', 'light');
      root.style.backgroundColor = '#FAF8F5';
    } else if (theme === 'light') {
      root.classList.add('theme-light', 'light');
      root.style.backgroundColor = '#FFFFFF';
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

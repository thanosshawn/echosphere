
// src/contexts/ThemeContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = "light" | "dark" | "theme-pink" | "theme-green";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "echosphere-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light"); // Default theme
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.className = storedTheme; // Apply on initial load
    } else {
      // Optional: Detect system preference for dark mode if no theme is stored
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setThemeState(initialTheme);
      document.documentElement.className = initialTheme;
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    if (!isMounted) return; // Prevent setting theme before hydration

    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.className = newTheme; // Apply to <html> tag
  }, [isMounted]);

  if (!isMounted) {
    // Avoid rendering children until theme is determined to prevent flash/mismatch
    // You can return a loader here if preferred, or null/fragment
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

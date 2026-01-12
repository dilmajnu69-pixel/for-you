'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isVisualizerActive: boolean;
  toggleVisualizer: () => void;
}

// Context for managing application theme (light/dark mode)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);

  // Load saved theme preference from localStorage on mount
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      // eslint-disable-next-line
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Check for saved visualizer preference
    const savedVisualizer = localStorage.getItem('visualizerActive');
    if (savedVisualizer === 'true') {
      setIsVisualizerActive(true);
    }
  }, []);

  // Toggle between light and dark mode and persist to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Update data-theme attribute for global CSS styling
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleVisualizer = () => {
    setIsVisualizerActive(prev => {
      const newState = !prev;
      localStorage.setItem('visualizerActive', String(newState));
      return newState;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isVisualizerActive, toggleVisualizer }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to consume the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type Theme = {
  name: string;
  colors: {
    background: string;
    'component-background': string;
    foreground: string;
    'muted-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    ring: string;
  };
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resetToDefault: (themeName: 'light' | 'dark') => void;
}

// --- Default Themes ---
export const defaultThemes: Record<'light' | 'dark', Theme> = {
  light: {
    name: 'light',
    colors: {
      background: 'hsl(0 0% 100%)',
      'component-background': 'hsl(0 0% 98%)',
      foreground: 'hsl(222.2 47.4% 11.2%)',
      'muted-foreground': 'hsl(215 20% 45%)',
      primary: 'hsl(142.1 76.2% 30.3%)', // Main green
      'primary-foreground': 'hsl(0 0% 100%)',
      secondary: 'hsl(210 40% 96.1%)',
      'secondary-foreground': 'hsl(222.2 47.4% 11.2%)',
      destructive: 'hsl(0 74.2% 50.2%)',
      'destructive-foreground': 'hsl(0 0% 100%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(142.1 76.2% 36.3%)',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: 'hsl(222.2 84% 4.9%)',
      'component-background': 'hsl(222.2 47.4% 11.2%)',
      foreground: 'hsl(210 40% 98%)',
      'muted-foreground': 'hsl(215 20% 65%)',
      primary: 'hsl(142.1 80.6% 45.3%)', // Main green
      'primary-foreground': 'hsl(0 0% 100%)',
      secondary: 'hsl(217.2 32.6% 17.5%)',
      'secondary-foreground': 'hsl(210 40% 98%)',
      destructive: 'hsl(0 72.8% 40.6%)',
      'destructive-foreground': 'hsl(0 0% 98%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      ring: 'hsl(142.1 70.6% 45.3%)',
    },
  },
};


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      try {
        // Basic validation to ensure it's a theme object
        const parsed = JSON.parse(storedTheme);
        if (parsed && parsed.name && parsed.colors) {
          return parsed;
        }
      } catch (e) {
        localStorage.removeItem('theme');
      }
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? defaultThemes.dark : defaultThemes.light;
  });

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem('theme', JSON.stringify(newTheme));
    setThemeState(newTheme);
  }, []);

  const resetToDefault = (themeName: 'light' | 'dark') => {
    setTheme(defaultThemes[themeName]);
  };

  useEffect(() => {
    const root = window.document.documentElement;

    for (const [key, value] of Object.entries(theme.colors)) {
        const hslMatch = value.match(/hsl\(([^)]+)\)/);
        if (hslMatch) {
            root.style.setProperty(`--${key}`, hslMatch[1]);
        } else {
            // Handle hex or other formats if needed, convert to HSL numbers
            // For now, assuming HSL
        }
    }
  }, [theme]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    resetToDefault,
  }), [theme, setTheme, resetToDefault]);

  return (
    <ThemeContext.Provider value={contextValue}>
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

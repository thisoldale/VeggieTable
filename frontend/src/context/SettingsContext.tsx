import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// Sunday: 0, Monday: 1, ..., Saturday: 6
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Settings {
  weekStartsOn: Day;
}

interface SettingsContextType {
  settings: Settings;
  setWeekStartsOn: (day: Day) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getStoredSettings = (): Settings => {
  try {
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.weekStartsOn === 'number' && parsed.weekStartsOn >= 0 && parsed.weekStartsOn <= 6) {
        return { weekStartsOn: parsed.weekStartsOn as Day };
      }
    }
  } catch (error) {
    console.error("Failed to parse settings from localStorage", error);
    localStorage.removeItem('userSettings');
  }
  // Default settings
  return { weekStartsOn: 0 }; // Sunday
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(getStoredSettings);

  const setWeekStartsOn = useCallback((day: Day) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, weekStartsOn: day };
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const contextValue = useMemo(() => ({
    settings,
    setWeekStartsOn,
  }), [settings, setWeekStartsOn]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
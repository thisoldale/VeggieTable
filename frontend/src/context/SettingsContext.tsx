import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// Sunday: 0, Monday: 1, ..., Saturday: 6
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Settings {
  weekStartsOn: Day;
  groupByTaskType: boolean;
}

interface SettingsContextType {
  settings: Settings;
  setWeekStartsOn: (day: Day) => void;
  setGroupByTaskType: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getStoredSettings = (): Settings => {
  try {
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const weekStartsOn = (typeof parsed.weekStartsOn === 'number' && parsed.weekStartsOn >= 0 && parsed.weekStartsOn <= 6) ? parsed.weekStartsOn : 0;
      const groupByTaskType = typeof parsed.groupByTaskType === 'boolean' ? parsed.groupByTaskType : false;
      return { weekStartsOn, groupByTaskType };
    }
  } catch (error) {
    console.error("Failed to parse settings from localStorage", error);
    localStorage.removeItem('userSettings');
  }
  // Default settings
  return { weekStartsOn: 0, groupByTaskType: false };
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

  const setGroupByTaskType = useCallback((enabled: boolean) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, groupByTaskType: enabled };
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const contextValue = useMemo(() => ({
    settings,
    setWeekStartsOn,
    setGroupByTaskType,
  }), [settings, setWeekStartsOn, setGroupByTaskType]);

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
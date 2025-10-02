import React from 'react';
import { useSettings } from './context/SettingsContext';

type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const dayNames: Record<Day, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const SettingsPage: React.FC = () => {
  const { settings, setWeekStartsOn } = useSettings();

  const handleWeekStartChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const day = parseInt(event.target.value, 10) as Day;
    setWeekStartsOn(day);
  };

  return (
    <div className="p-4 md:px-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="max-w-md">
        <div className="mb-4">
          <label htmlFor="week-start" className="block text-sm font-medium text-muted-foreground mb-1">
            Start of Week
          </label>
          <select
            id="week-start"
            value={settings.weekStartsOn}
            onChange={handleWeekStartChange}
            className="w-full p-2 border border-border rounded-md bg-component-background"
          >
            {Object.entries(dayNames).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground mt-2">
            Choose which day the calendar weeks should start on.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
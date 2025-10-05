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
  const { settings, setWeekStartsOn, setGroupByTaskType } = useSettings();

  const handleWeekStartChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const day = parseInt(event.target.value, 10) as Day;
    setWeekStartsOn(day);
  };

  const handleGroupByTaskTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGroupByTaskType(event.target.checked);
  };

  return (
    <div className="p-4 md:px-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="max-w-md space-y-8">
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

        <div>
          <label htmlFor="group-by-task-type" className="flex items-center space-x-3">
            <input
              id="group-by-task-type"
              type="checkbox"
              checked={settings.groupByTaskType}
              onChange={handleGroupByTaskTypeChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-muted-foreground">
              Group calendar items by task type
            </span>
          </label>
          <p className="text-sm text-muted-foreground mt-2">
            Enable to group all items for the week by their type (e.g., Sow, Harvest) instead of by day.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
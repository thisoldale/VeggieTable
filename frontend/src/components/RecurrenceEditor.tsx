import React, { useState, useEffect } from 'react';
import { RRule, rrulestr } from 'rrule';

interface RecurrenceEditorProps {
  value: string; // RRULE string
  onChange: (value: string) => void;
}

const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({ value, onChange }) => {
  const [freq, setFreq] = useState(RRule.WEEKLY);
  const [interval, setInterval] = useState(1);
  // Use simple numbers for byday (0=Sun, 1=Mon, etc.)
  const [byday, setByday] = useState<number[]>([new Date().getDay()]);
  const [until, setUntil] = useState<Date | null>(null);

  useEffect(() => {
    if (value) {
      try {
        const rule = rrulestr(value);
        if (rule instanceof RRule) {
          const options = rule.options;
          setFreq(options.freq);
          setInterval(options.interval);
          if (options.byday !== null && options.byday !== undefined) {
             const days = Array.isArray(options.byday) ? options.byday : [options.byday];
             setByday(days);
          }
          if (options.until) {
            const utcDate = options.until;
            const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
            setUntil(localDate);
          }
        }
      } catch (e) {
        console.error("Error parsing RRULE string:", e);
      }
    }
  }, [value]);

  useEffect(() => {
    if (freq === RRule.WEEKLY && byday.length === 0) {
      return;
    }

    const options: any = {
      freq,
      interval,
      dtstart: new Date(),
    };
    if (freq === RRule.WEEKLY) {
      options.byday = byday;
    }
    if (until) {
      options.until = until;
    }
    const newRule = new RRule(options);
    onChange(newRule.toString());
  }, [freq, interval, byday, until, onChange]);

  const handleWeekdayToggle = (day: number) => {
    setByday(prev => {
      const isSelected = prev.includes(day);
      if (isSelected) {
        if (prev.length === 1) return prev; // Prevent unselecting the last day
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const weekdayOptions = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  return (
    <div className="space-y-4 p-4 border border-border rounded-md bg-component-background">
      <div className="flex items-center space-x-2">
        <span>Repeat every</span>
        <input
          type="number"
          min="1"
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value, 10) || 1)}
          className="w-16 p-1 border border-border rounded-md bg-background"
        />
        <select
          value={freq}
          onChange={(e) => setFreq(parseInt(e.target.value, 10))}
          className="p-1 border border-border rounded-md bg-background"
        >
          <option value={RRule.DAILY}>Day(s)</option>
          <option value={RRule.WEEKLY}>Week(s)</option>
          <option value={RRule.MONTHLY}>Month(s)</option>
          <option value={RRule.YEARLY}>Year(s)</option>
        </select>
      </div>

      {freq === RRule.WEEKLY && (
        <div>
          <span className="block mb-2">Repeat on</span>
          <div className="flex space-x-1">
            {weekdayOptions.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleWeekdayToggle(day.value)}
                className={`w-10 h-10 rounded-full ${
                  byday.includes(day.value) ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <span>Ends on</span>
        <input
          type="date"
          value={until ? until.toISOString().split('T')[0] : ''}
          onChange={(e) => setUntil(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
          className="p-1 border border-border rounded-md bg-background"
        />
        <button type="button" onClick={() => setUntil(null)} className="text-sm text-primary">
          Clear
        </button>
      </div>
    </div>
  );
};

export default RecurrenceEditor;
import React, { useState, useEffect, useMemo } from 'react';
import { RRule, rrulestr, Weekday } from 'rrule';
import { RecurrenceOptionsSchema, RecurrenceOptions } from '../schemas';

interface RecurrenceEditorProps {
  value: string; // RRULE string
  onChange: (value: string) => void;
  startDate?: Date;
}

const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({ value, onChange, startDate }) => {
  const defaultDate = startDate || new Date();
  const [options, setOptions] = useState<RecurrenceOptions>({
    freq: RRule.WEEKLY,
    interval: 1,
    byweekday: [new Weekday(defaultDate.getDay())],
    bymonthday: defaultDate.getDate(),
    bysetpos: 1,
    bymonth: defaultDate.getMonth() + 1,
    count: 1,
    until: null,
    endType: 'never',
    dailyOption: 'everyday',
    monthlyOption: 'day_of_month',
  });

  const weekdayOptions = useMemo(() => [
    { label: 'Sunday', value: RRule.SU.weekday },
    { label: 'Monday', value: RRule.MO.weekday },
    { label: 'Tuesday', value: RRule.TU.weekday },
    { label: 'Wednesday', value: RRule.WE.weekday },
    { label: 'Thursday', value: RRule.TH.weekday },
    { label: 'Friday', value: RRule.FR.weekday },
    { label: 'Saturday', value: RRule.SA.weekday },
  ], []);

  // Effect to parse incoming RRULE string and update state
  useEffect(() => {
    if (value) {
      try {
        const rule = rrulestr(value);
        if (rule instanceof RRule) {
          const { freq, interval, until, count, byweekday, bymonthday, bysetpos, bymonth } = rule.options;

          let byweekdayState: Weekday[] | null = null;
          if (byweekday !== null && byweekday !== undefined) {
            const days = Array.isArray(byweekday) ? byweekday : [byweekday];
            byweekdayState = days.map(d => (typeof d === 'number' ? new Weekday(d) : d));
          }

          setOptions(prev => ({
            ...prev,
            freq,
            interval,
            until: until ? new Date(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()) : null,
            count: count ?? null,
            byweekday: byweekdayState,
            bymonthday: bymonthday ?? prev.bymonthday,
            bysetpos: (Array.isArray(bysetpos) ? bysetpos[0] : bysetpos) ?? prev.bysetpos,
            bymonth: (Array.isArray(bymonth) ? bymonth[0] : bymonth) ?? prev.bymonth,
            endType: until ? 'date' : count ? 'count' : 'never',
            dailyOption: byweekdayState?.length === 5 ? 'weekdays' : 'everyday',
            monthlyOption: bysetpos ? 'day_of_week' : 'day_of_month',
          }));
        }
      } catch (e) {
        console.error("Error parsing RRULE string:", e);
      }
    }
  }, [value]);

  // Effect to generate RRULE string when options change
  useEffect(() => {
    const result = RecurrenceOptionsSchema.safeParse(options);
    if (!result.success) {
      // For now, we'll log the errors. In a more advanced implementation,
      // you might show these errors in the UI.
      console.error("Recurrence validation error:", result.error.flatten());
      return;
    }

    const { freq, interval, byweekday, bymonthday, bysetpos, bymonth, count, until, endType, dailyOption, monthlyOption } = result.data;

    const rruleOptions: Partial<RRule.Options> = {
      freq,
      interval,
      dtstart: startDate || new Date(),
    };

    // Map custom Weekday objects back to RRule Weekday constants if necessary
    if (byweekday) {
      // The schema returns objects like { weekday: 0 }. RRule needs [RRule.MO, ...] or similar constants/objects.
      // RRule.MO is NOT just { weekday: 0 }, it's an instance of Weekday.
      // However, the state `options.byweekday` already contains `Weekday` instances (from `new Weekday(d)`).
      // But Zod might strip prototype if we are not careful? No, Zod validation passed.
      // Let's ensure we are passing valid Weekday instances to RRule.
      rruleOptions.byweekday = byweekday.map(d => new Weekday(d.weekday));
    }

    if (endType === 'date' && until) {
      rruleOptions.until = until;
    } else if (endType === 'count' && count) {
      rruleOptions.count = count;
    }


    switch (freq) {
      case RRule.DAILY:
        if (dailyOption === 'weekdays') {
          rruleOptions.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
        }
        break;
      case RRule.WEEKLY:
        // byweekday is already set in rruleOptions above if present
        break;
      case RRule.MONTHLY:
        if (monthlyOption === 'day_of_month' && bymonthday) {
          rruleOptions.bymonthday = bymonthday;
          delete rruleOptions.byweekday; // Ensure byweekday is not set if using day_of_month
        } else if (monthlyOption === 'day_of_week' && bysetpos && byweekday && byweekday.length > 0) {
          rruleOptions.bysetpos = bysetpos;
          // byweekday is already set
        }
        break;
      case RRule.YEARLY:
        rruleOptions.bymonth = bymonth;
        if (monthlyOption === 'day_of_month' && bymonthday) {
          rruleOptions.bymonthday = bymonthday;
          delete rruleOptions.byweekday;
        } else if (monthlyOption === 'day_of_week' && bysetpos && byweekday && byweekday.length > 0) {
          rruleOptions.bysetpos = bysetpos;
          // byweekday is already set
        }
        break;
    }

    try {
      // console.log("rruleOptions:", rruleOptions);
      const newRule = new RRule(rruleOptions);
      // Strip DTSTART from the string. The backend uses the task's due_date as the start date.
      // We also strip 'RRULE:' prefix to keep it clean and avoid potential parsing issues if the backend or rrulestr behaves strictly.
      const lines = newRule.toString().split('\n');
      const ruleString = lines
        .filter(line => !line.startsWith('DTSTART'))
        .map(line => line.replace(/^RRULE:/, ''))
        .join('\n');

      onChange(ruleString);
    } catch (e) {
      console.error("Error creating RRule:", e, "with options:", rruleOptions);
    }
  }, [options, onChange, startDate]);

  const handleUpdate = (updates: Partial<RecurrenceOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  const handleFreqChange = (newFreq: number) => {
    const defaultDate = startDate || new Date();
    const currentDay = new Weekday(defaultDate.getDay());
    let newOptions: Partial<RecurrenceOptions> = { freq: newFreq };

    // Reset options to sensible defaults when frequency changes
    switch (newFreq) {
      case RRule.DAILY:
        newOptions = { ...newOptions, byweekday: null, dailyOption: 'everyday' };
        break;
      case RRule.WEEKLY:
        newOptions = { ...newOptions, byweekday: [currentDay] };
        break;
      case RRule.MONTHLY:
        newOptions = { ...newOptions, monthlyOption: 'day_of_month', byweekday: [currentDay], bymonthday: defaultDate.getDate(), bysetpos: 1 };
        break;
      case RRule.YEARLY:
        newOptions = { ...newOptions, monthlyOption: 'day_of_month', byweekday: [currentDay], bymonthday: defaultDate.getDate(), bysetpos: 1, bymonth: defaultDate.getMonth() + 1 };
        break;
    }
    // Set final state in one go
    setOptions(prev => ({
      ...prev,
      ...newOptions,
    }));
  };

  const handleWeekdayToggle = (day: Weekday) => {
    setOptions(prev => {
      const currentByweekday = prev.byweekday || [];
      const isSelected = currentByweekday.some(d => d.weekday === day.weekday);
      let newByweekday;
      if (isSelected) {
        if (currentByweekday.length === 1) return prev; // Prevent unselecting the last day
        newByweekday = currentByweekday.filter(d => d.weekday !== day.weekday);
      } else {
        newByweekday = [...currentByweekday, day].sort((a, b) => a.weekday - b.weekday);
      }
      return { ...prev, byweekday: newByweekday };
    });
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-md bg-component-background">
      {/* Basic Frequency and Interval */}
      <div className="flex items-center space-x-2">
        <span>Repeat every</span>
        <input type="number" min="1" value={options.interval} onChange={(e) => handleUpdate({ interval: parseInt(e.target.value, 10) || 1 })} className="w-16 p-1 border border-border rounded-md bg-background" />
        <select value={options.freq} onChange={(e) => handleFreqChange(parseInt(e.target.value, 10))} className="p-1 border border-border rounded-md bg-background">
          <option value={RRule.DAILY}>Day(s)</option>
          <option value={RRule.WEEKLY}>Week(s)</option>
          <option value={RRule.MONTHLY}>Month(s)</option>
          <option value={RRule.YEARLY}>Year(s)</option>
        </select>
      </div>

      {/* Dynamic Options based on Frequency */}
      {options.freq === RRule.DAILY && (
        <div className="flex items-center space-x-4">
          <label><input type="radio" name="dailyOption" value="everyday" checked={options.dailyOption === 'everyday'} onChange={() => handleUpdate({ dailyOption: 'everyday' })} /> Every day</label>
          <label><input type="radio" name="dailyOption" value="weekdays" checked={options.dailyOption === 'weekdays'} onChange={() => handleUpdate({ dailyOption: 'weekdays' })} /> Every weekday</label>
        </div>
      )}
      {options.freq === RRule.WEEKLY && (
        <div>
          <span className="block mb-2">Repeat on</span>
          <div className="flex space-x-1">
            {weekdayOptions.map(day => (
              <button key={day.value} type="button" onClick={() => handleWeekdayToggle(new Weekday(day.value))} className={`w-10 h-10 rounded-full ${options.byweekday?.some(d => d.weekday === day.value) ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {day.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}
      {(options.freq === RRule.MONTHLY || options.freq === RRule.YEARLY) && (
        <div className="space-y-2">
          {options.freq === RRule.YEARLY && (
            <div className="flex items-center space-x-2">
              <span>On</span>
              <select value={options.bymonth ?? 1} onChange={e => handleUpdate({ bymonth: parseInt(e.target.value) })} className="p-1 border border-border rounded-md bg-background">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
          )}
          <div><label><input type="radio" name="monthlyOption" value="day_of_month" checked={options.monthlyOption === 'day_of_month'} onChange={() => handleUpdate({ monthlyOption: 'day_of_month', byweekday: [new Weekday(new Date().getDay())] })} /> On day <input type="number" min="1" max="31" value={options.bymonthday ?? 1} onChange={e => handleUpdate({ bymonthday: parseInt(e.target.value) || 1 })} className="w-14 p-1 border rounded bg-background" /></label></div>
          <div>
            <label className="flex items-center space-x-2"><input type="radio" name="monthlyOption" value="day_of_week" checked={options.monthlyOption === 'day_of_week'} onChange={() => handleUpdate({ monthlyOption: 'day_of_week' })} /> On the</label>
            <div className="flex items-center space-x-2 mt-1 pl-6">
              <select value={options.bysetpos ?? 1} onChange={e => handleUpdate({ bysetpos: parseInt(e.target.value) })} className="p-1 border rounded bg-background">
                <option value="1">First</option><option value="2">Second</option><option value="3">Third</option><option value="4">Fourth</option><option value="-1">Last</option>
              </select>
              <select value={options.byweekday && options.byweekday.length > 0 ? options.byweekday[0].weekday : 0} onChange={e => handleUpdate({ byweekday: [new Weekday(parseInt(e.target.value))] })} className="p-1 border rounded bg-background">
                {weekdayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* End Condition */}
      <div className="space-y-2">
        <span className="block text-sm font-medium">Ends</span>
        <div className="flex items-center space-x-2">
          <label><input type="radio" value="never" checked={options.endType === 'never'} onChange={() => handleUpdate({ endType: 'never' })} /> Never</label>
        </div>
        <div className="flex items-center space-x-2">
          <label><input type="radio" value="date" checked={options.endType === 'date'} onChange={() => handleUpdate({ endType: 'date' })} /> On</label>
          <input type="date" value={options.until ? options.until.toISOString().split('T')[0] : ''} onChange={(e) => handleUpdate({ endType: 'date', until: e.target.value ? new Date(e.target.value + 'T00:00:00') : null })} className="p-1 border rounded bg-background" disabled={options.endType !== 'date'} />
        </div>
        <div className="flex items-center space-x-2">
          <label><input type="radio" value="count" checked={options.endType === 'count'} onChange={() => handleUpdate({ endType: 'count' })} /> After</label>
          <input type="number" min="1" value={options.count ?? 1} onChange={(e) => handleUpdate({ endType: 'count', count: parseInt(e.target.value) || 1 })} className="w-20 p-1 border rounded bg-background" disabled={options.endType !== 'count'} />
          <span>occurrences</span>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceEditor;
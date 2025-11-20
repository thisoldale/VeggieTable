import pkg from 'rrule';
const { RRule, Weekday } = pkg;
import { z } from 'zod';

// Mimic schema
const WeekdaySchema = z.object({
    weekday: z.number().min(0).max(6),
    n: z.number().optional(),
});

const RecurrenceOptionsSchema = z.object({
    freq: z.number(),
    interval: z.number().min(1),
    byweekday: z.array(WeekdaySchema).nullable(),
}).passthrough(); // simplified

// Mimic component logic
function testLogic() {
    console.log("Starting test...");

    // 1. State as it comes from Zod (plain objects)
    const options = {
        freq: RRule.WEEKLY,
        interval: 1,
        byweekday: [{ weekday: 0 }, { weekday: 2 }], // Mon, Wed
    };

    console.log("Options:", options);

    // 2. Parse with Zod
    const result = RecurrenceOptionsSchema.safeParse(options);
    if (!result.success) {
        console.error("Validation failed:", result.error);
        return;
    }

    const data = result.data;
    console.log("Parsed data:", data);

    // 3. Construct RRule options
    const rruleOptions = {
        freq: data.freq,
        interval: data.interval,
        dtstart: new Date(),
    };

    // 4. Map weekdays
    if (data.byweekday) {
        // Before fix: rruleOptions.byweekday = data.byweekday;
        // (If I did this, RRule might complain if it expects Weekday instances but gets plain objects?
        // RRule source says: isWeekday = (obj) => obj instanceof Weekday. So yes, it expects instances.)

        // After fix:
        rruleOptions.byweekday = data.byweekday.map(d => new Weekday(d.weekday));
    }

    try {
        const rule = new RRule(rruleOptions);
        console.log("Rule created successfully:", rule.toString());
    } catch (e) {
        console.error("Rule creation failed:", e);
    }
}

testLogic();

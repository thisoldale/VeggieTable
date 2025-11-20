import pkg from 'rrule';
const { rrulestr } = pkg;

try {
    console.log("Testing BYWEEKDAY...");
    const rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYWEEKDAY=MO");
    console.log("Success BYWEEKDAY:", rule.toString());
} catch (e) {
    console.log("Failed BYWEEKDAY:", e.message);
}

try {
    console.log("Testing BYDAY...");
    const rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO");
    console.log("Success BYDAY:", rule.toString());
} catch (e) {
    console.log("Failed BYDAY:", e.message);
}

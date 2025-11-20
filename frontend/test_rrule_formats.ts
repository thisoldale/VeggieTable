import pkg from 'rrule';
const { rrulestr } = pkg;

function testParsing() {
    const cases = [
        "FREQ=WEEKLY;BYDAY=MO",
        "RRULE:FREQ=WEEKLY;BYDAY=MO",
        "DTSTART:20240522T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO",
        "RRULE:FREQ=WEEKLY;BYDAY=MO\nDTSTART:20240522T000000Z", // Reversed?
        "FREQ=WEEKLY;BYDAY=undefined", // Expect fail
    ];

    cases.forEach(c => {
        try {
            console.log(`Testing: "${c.replace(/\n/g, '\\n')}"`);
            const rule = rrulestr(c);
            console.log("  Success:", rule.toString());
        } catch (e) {
            console.log("  Failed:", e.message);
        }
    });
}

testParsing();

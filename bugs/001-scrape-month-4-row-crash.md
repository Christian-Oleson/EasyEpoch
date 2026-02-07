# Bug 001: scrapeMonth crashes for months with exactly 4 calendar rows

## Severity
**CRITICAL** — runtime crash

## Description
`scrapeMonth` in `date-util.ts` crashes with a `TypeError: Cannot read properties of undefined (reading 'length')` when rendering a month that fits exactly 4 calendar rows. This happens because the code assumes at least 5 rows exist (`tracker[4]`), but when only 4 rows are needed, `tracker[4]` is `undefined`.

## Affected File
`lib/date-util.ts`, lines 88-98

## Root Cause
The post-loop padding logic checks if `tracker[5]` is undefined (a 5-row month) and creates it, then sets `lastRow = 4`. But it never checks if `tracker[4]` exists. When a month only needs 4 rows (indices 0-3), `tracker[4]` is `undefined`, and accessing `.length` on it crashes.

```typescript
let lastRow = 5;
if (tracker[5] === undefined) {
  lastRow = 4;                    // assumes tracker[4] exists
  tracker[5] = fill([], 7);
}

let lastRowLength = tracker[lastRow].length;  // CRASH: tracker[4] is undefined
```

## Reproduction
Any non-leap-year February that starts on a Sunday (28 days = exactly 4 rows of 7):
- **February 2026** (starts on Sunday)
- **February 2015** (starts on Sunday)

```typescript
import { scrapeMonth } from './date-util';
scrapeMonth(new Date(2026, 1, 1));  // TypeError!
```

## Suggested Fix
Add a check for `tracker[4]` being undefined, similar to the `tracker[5]` check:

```typescript
let lastRow = 5;
if (tracker[5] === undefined) {
  lastRow = 4;
  tracker[5] = fill([], 7);
}
if (tracker[4] === undefined) {
  lastRow = 3;
  tracker[4] = fill([], 7);
}

let lastRowLength = tracker[lastRow].length;
if (lastRowLength < 7) {
  let filled = tracker[lastRow].concat(fill([], 7 - lastRowLength));
  tracker[lastRow] = filled;
}
```

## Test Coverage
Covered in `tests/date-util.test.ts` — "Known bugs" describe block, test: "BUG: scrapeMonth crashes for months with exactly 4 rows".

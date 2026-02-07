# Bug 002: readableDate missing ordinal suffix

## Severity
Low — cosmetic

## Description
The `readableDate` property on the SimplePicker instance does not include an ordinal suffix (e.g., "1st", "2nd", "3rd"). Instead it contains the raw number (e.g., "1", "15"). The `getDisplayDate` function exists and correctly adds ordinal suffixes, but `updateSelectedDate` does not use it.

## Affected File
`lib/index.ts`, lines 261-264

## Root Cause
In `updateSelectedDate`, the readable date is built by concatenating `day` (a raw number string) with the month/year/time. The code replaces the leading digits with `date.getDate().toString()`, which is also just the raw number — no ordinal suffix is ever applied.

```typescript
let _date = day + ' ';
_date += $monthAndYear.innerHTML.trim() + ' ';
_date += $time.innerHTML.trim();
this.readableDate = _date.replace(/^\d+/, date.getDate().toString());
```

## Expected Behavior
`readableDate` should contain something like `"15th June 2024 12:00 PM"` instead of `"15 June 2024 12:00 PM"`.

## Suggested Fix
Use `dateUtil.getDisplayDate(date)` instead of `date.getDate().toString()`:

```typescript
this.readableDate = _date.replace(/^\d+/, dateUtil.getDisplayDate(date));
```

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: readableDate does not include ordinal suffix".

# Bug 007: Error message typo "scrapePrevoisMonth" in both navigation functions

## Severity
Low — cosmetic

## Description
Both `scrapePreviousMonth` and `scrapeNextMonth` contain the same typo in their error message: "scrapePrevoisMonth" instead of the correct function name. Additionally, `scrapeNextMonth` incorrectly references the previous month function name in its error.

## Affected File
`lib/date-util.ts`

### scrapePreviousMonth (line 107)
```typescript
throw Error('scrapePrevoisMonth called without setting monthTracker.current!');
//           ^^^^^^^^^^^^^^^^^ typo: should be "scrapePreviousMonth"
```

### scrapeNextMonth (line 117)
```typescript
throw Error('scrapePrevoisMonth called without setting monthTracker.current!');
//           ^^^^^^^^^^^^^^^^^ typo AND wrong function name: should be "scrapeNextMonth"
```

## Suggested Fix
- Line 107: Change to `'scrapePreviousMonth called without setting monthTracker.current!'`
- Line 117: Change to `'scrapeNextMonth called without setting monthTracker.current!'`

## Test Coverage
Covered in `tests/date-util.test.ts` — "Known bugs" describe block, test: "BUG: scrapeNextMonth error message says scrapePrevoisMonth".

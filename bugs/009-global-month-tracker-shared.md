# Bug 009: Global monthTracker.current shared across instances

## Severity
Medium — incorrect behavior with multiple instances

## Description
The `monthTracker` object is a module-level singleton shared across all SimplePicker instances:

```typescript
export const monthTracker: MonthTracker = {
  years: {}
};
```

When `scrapeMonth` is called, it sets `monthTracker.current` to the first day of the given month (line 57-58). Since all instances share this state, navigating months in one picker affects the starting point for month navigation in another picker.

## Affected File
`lib/date-util.ts`, lines 6-8

## Impact
With multiple SimplePicker instances on the same page:
1. Navigating to July in picker A sets `monthTracker.current` to July 1
2. Clicking "next month" in picker B (which was showing March) jumps to August instead of April
3. The cached month data in `monthTracker.years` is also shared, which is less harmful but still unexpected

## Suggested Fix
Move month tracking state into the SimplePicker instance rather than using a module-level singleton. Each instance should maintain its own `currentMonth` state.

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: monthTracker.current is global shared state".

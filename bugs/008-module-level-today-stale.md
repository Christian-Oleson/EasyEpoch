# Bug 008: Module-level `today` goes stale across midnight

## Severity
Medium — incorrect behavior over time

## Description
The module-level constant `today` is initialized once when `index.ts` is first imported:

```typescript
const today = new Date();  // line 22
```

This value is used in `init()` to render the initial calendar and set the initial selected date (lines 115, 120). If the page remains open past midnight, the picker will still show the previous day's date as "today" on subsequent `open()` calls or new instances.

## Affected File
`lib/index.ts`, line 22

## Impact
- Long-running single-page applications will show stale dates
- The initial calendar month and selected date will be wrong after midnight

## Suggested Fix
Replace the module-level `today` with a function call or compute the date inside `init()`:

```typescript
// Instead of:
const today = new Date();

// Use fresh dates in init():
init(el: HTMLElement, opts: SimplePickerOpts) {
  const today = new Date();
  // ... rest of init
}
```

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: module-level today variable goes stale".

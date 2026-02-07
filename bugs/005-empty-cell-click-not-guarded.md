# Bug 005: Clicking empty calendar cells not guarded

## Severity
Medium — incorrect behavior

## Description
When a user clicks on an empty `<td>` cell in the calendar (cells that don't contain a date), the click handler still calls `selectDateElement` on it. This sets the active class on an empty cell and produces an invalid `selectedDate`.

## Affected File
`lib/index.ts`, lines 364-367

```typescript
if (tagName === 'td') {
  _this.selectDateElement(target);
  return;
}
```

## Root Cause
The click handler checks if the clicked element is a `<td>` but does not check whether the cell actually contains a date. Empty cells have a `data-empty` attribute set by the `render` method (line 205), but this is not checked before calling `selectDateElement`.

## Expected Behavior
Clicking an empty calendar cell should be a no-op.

## Suggested Fix
Check for the `data-empty` attribute before processing the click:

```typescript
if (tagName === 'td' && target.dataset.empty === undefined) {
  _this.selectDateElement(target);
  return;
}
```

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: clicking empty td cells is not guarded".

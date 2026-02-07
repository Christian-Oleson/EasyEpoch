# Bug 010: getDisplayDate missing type annotation for parameter

## Severity
Low — TypeScript strictness

## Description
The `getDisplayDate` function in `date-util.ts` is missing a type annotation for its `_date` parameter. With `noImplicitAny` enabled in tsconfig, this would be a compile error. Currently it compiles because `noImplicitAny` is not enabled.

## Affected File
`lib/date-util.ts`, line 130

```typescript
export function getDisplayDate(_date) {  // _date has implicit 'any' type
  const date = _date.getDate();
```

## Expected
```typescript
export function getDisplayDate(_date: Date) {
```

## Impact
- No runtime impact; purely a TypeScript strictness issue
- Prevents enabling `noImplicitAny` in the project

## Suggested Fix
Add the type annotation `_date: Date`.

## Test Coverage
Covered in `tests/date-util.test.ts` — "Known bugs" describe block, test: "BUG: getDisplayDate has no type annotation for parameter".

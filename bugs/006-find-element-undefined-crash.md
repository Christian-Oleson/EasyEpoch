# Bug 006: findElementWithDate can return undefined causing TypeError in reset()

## Severity
Medium — potential runtime crash

## Description
`findElementWithDate` can return `undefined` when no matching `<td>` element is found. When called from `reset()` without the `returnLastIfNotFound` flag, the return value is used directly without a null check, causing a `TypeError: Cannot read properties of undefined (reading 'classList')`.

## Affected File
`lib/index.ts`

### findElementWithDate (lines 278-298)
```typescript
findElementWithDate(date, returnLastIfNotFound: boolean = false) {
  const { $tds } = this;
  let el, lastTd;
  $tds.forEach((td) => {
    const content = td.innerHTML.trim();
    if (content === date) { el = td; }
    if (content !== '') { lastTd = td; }
  });
  if (el === undefined && returnLastIfNotFound) { el = lastTd; }
  return el;  // can be undefined!
}
```

### reset() call site (lines 147-149)
```typescript
const dateString = date.getDate().toString();
const $dateEl = this.findElementWithDate(dateString);
if (!$dateEl.classList.contains('active')) {  // TypeError if $dateEl is undefined
```

## Reproduction
This can happen when `reset()` is called with a date whose day number doesn't appear in the currently rendered month (edge case with month transitions or stale state).

## Suggested Fix
Add a null guard before accessing `$dateEl`:

```typescript
const $dateEl = this.findElementWithDate(dateString);
if ($dateEl && !$dateEl.classList.contains('active')) {
  this.selectDateElement($dateEl);
  this.updateDateComponents(date);
}
```

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: findElementWithDate can return undefined".

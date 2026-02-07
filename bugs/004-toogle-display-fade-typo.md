# Bug 004: toogleDisplayFade method name typo

## Severity
Low — API inconsistency

## Description
The method `toogleDisplayFade` on the SimplePicker class has a typo: "toogle" instead of "toggle". This is a private method so it doesn't directly affect the public API, but it's inconsistent and confusing.

## Affected File
`lib/index.ts`, line 429

```typescript
toogleDisplayFade() {
  this.$time.classList.toggle('simplepicker-fade');
  this.$displayDateElements.forEach($el => {
    $el.classList.toggle('simplepicker-fade');
  });
}
```

Also called at lines 317 and 330:
```typescript
this.toogleDisplayFade();
```

## Suggested Fix
Rename to `toggleDisplayFade` in all three locations (definition + 2 call sites).

## Test Coverage
Covered in `tests/simplepicker.test.ts` — "Known bugs" describe block, test: "BUG: toogleDisplayFade has typo in method name".

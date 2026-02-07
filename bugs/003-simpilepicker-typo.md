# Bug 003: "simpilepicker" typo in CSS class name

## Severity
Low — cosmetic / API inconsistency

## Description
The CSS class `simpilepicker-date-picker` has a typo: "simpilepicker" instead of "simplepicker". This typo is consistent across the template and the code that references it, so it doesn't cause a runtime error, but it creates an inconsistent public API.

## Affected Files
- `lib/template.ts`, line 12: `<div class="simpilepicker-date-picker">`
- `lib/index.ts`, line 95: `this.$simplepicker = $('.simpilepicker-date-picker');`

## Impact
- Users targeting this class in custom CSS would need to use the misspelled name
- The typo is "baked in" — both the template and the selector use the same misspelling, so it works correctly at runtime

## Suggested Fix
Rename to `simplepicker-date-picker` in both locations. This is a **breaking change** for any users who target this class in their own CSS.

## Test Coverage
Covered in `tests/template.test.ts` — test: "should contain the date picker class (note: known typo 'simpilepicker')".

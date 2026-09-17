# Changelog

All notable changes to EasyEpoch are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-09-17

### Added

- **ES module build.** `dist/easyepoch.mjs` is a real ES module with a default
  export, wired up through an `import` condition in `exports` (plus a `module`
  field for older bundlers). Bundlers and native ESM — including
  `<script type="module">` straight from a CDN — now get a module instead of
  going through CommonJS interop. `require('easyepoch')` and
  `import EasyEpoch = require('easyepoch')` are unchanged, and each condition
  ships its own type declarations.
- **Browser smoke tests** (Playwright, Chromium) covering what jsdom
  structurally cannot: focus moving into the dialog, the `Tab` focus trap,
  `Escape` restoring focus to the trigger, pane visibility, and keyboard
  date navigation against the real built bundle.

### Removed

- **`dist/simplepicker.*`** — six leftover pre-fork artifacts (~108 KB) that
  were published with every install, never rebuilt, and referenced nowhere.
  Removing them frees more than the new ESM bundle and its sourcemap add
  back, so unpacked install size still drops (325 kB → 319 kB); the packed
  tarball grows slightly (82.6 kB → 88.4 kB) because the ESM bundle
  compresses less well than the redundant legacy copies did.

### Fixed

- `sideEffects` was `false`, which let bundlers tree-shake away a bare
  `import 'easyepoch/css'` and leave the picker unstyled in production builds.
  CSS is now declared side-effectful.
- `files` listed `easyepoch.d.ts`, which does not exist in the repository.
- CI now verifies that the committed `dist/` matches a fresh `npm run build`,
  so a dependency bump can no longer leave the published bundles stale (and
  running the build locally no longer silently dirties the working tree). The
  check rebuilds into a cleaned directory and inspects `git status`, so it also
  catches artifacts the build no longer emits and generated files that were
  never committed.
- CI now installs the packed tarball into a throwaway project and exercises
  every documented entry point — CommonJS, native ESM, the `easyepoch/css`
  subpath, and all three TypeScript import forms. Nothing previously covered
  the published layout, which is how 2.0.0 shipped with `require('easyepoch')`
  returning an empty object.

## [2.0.1] - 2026-09-16

### Fixed

- **`require('easyepoch')` and `import EasyEpoch from 'easyepoch'` returned an
  empty object instead of the class in 2.0.0**, breaking every bundler and
  Node consumer (the `<script>` global build was unaffected, which is why it
  went unnoticed). The Node/bundler build (`dist/easyepoch.node.js`) used the
  deprecated `library: undefined` + `libraryTarget: 'commonjs2'` combination,
  which under rspack 2 exported the entry's empty static namespace; it now
  uses `library: { type: 'commonjs2' }` so `module.exports` is the class
  again. If you installed 2.0.0, upgrade to 2.0.1. (#78 regression)

## [2.0.0] - 2026-09-16

### Breaking

- `disableTimeSection` now fully removes the time UI (icon, time display and
  time pane) **and** excludes time from the result: `selectedDate` is set to
  `00:00:00` and `readableDate` no longer includes a time. Previously the pane
  was only hidden and the last time value still leaked into both. (#49)
- The published bundles are now compiled to **ES2017** instead of ES5. The
  library already depended on unpolyfilled ES2015+ APIs (`Array.from`,
  `String.prototype.repeat`, `DOMParser`), so no previously-working browser
  loses support, but ES5-only environments are no longer a target. (#78)

### Added

- **Keyboard navigation** while the picker is open: `←`/`→` move by a day,
  `↑`/`↓` by a week, `Home`/`End` jump to the first/last day of the month,
  `PageUp`/`PageDown` move by a month (clamped to the target month's last
  day), `Shift`+`PageUp`/`PageDown` by a year, `Enter` submits and `Escape`
  cancels. Keys are not intercepted while the time input has focus. (#50)
- **Localization** via the `locale` option: `months`, `days`, `daysShort`,
  `ok`, `cancel`, tooltip titles and the dialog's accessible name. Anything
  not provided falls back to English; malformed values are rejected
  field-by-field. (#51)
- **Date range limits**: `minDate` / `maxDate` options (inclusive, by calendar
  day). Out-of-range cells are visually disabled, ignore clicks and are
  skipped by keyboard navigation. (#49)
- **Runtime bounds**: `setMinDate(date?)` / `setMaxDate(date?)` re-render the
  visible month immediately; pass `undefined` to clear a bound. (#52)
- **Linked pickers**: `linkAfter(other)`, `linkBefore(other)` and
  `EasyEpoch.linkRange(start, end)` for the from/to pattern — the end
  picker's lower bound tracks the start picker's selection and vice versa. (#52)
- `showSeconds` option: the time input accepts seconds and `selectedDate` /
  `readableDate` keep second-level precision. (#49)
- `destroy()`: closes the picker (restoring focus), detaches its
  document-level keyboard listener, removes the overlay and clears handlers.
  Previously every instance leaked a `document` `keydown` listener. (#78)
- **Accessibility**: the overlay is a modal dialog (`role="dialog"`,
  `aria-modal="true"`, accessible name), the calendar is an ARIA grid with
  roving tabindex, icon buttons have accessible names, the month header is an
  `aria-live` region, focus moves into the dialog on `open()` and is restored
  on `close()`, and `Tab`/`Shift+Tab` are trapped inside the dialog.
  Visible `:focus-visible` rings on cells and buttons. (#54)
- `date-util` exports `parseTimeInput`, `formatTime`, `formatTimeInputValue`
  and the `MonthGrid` / `MonthData` types. (#78)
- `package.json` declares `sideEffects: false` (bundler tree-shaking) and a
  `funding` entry; the repository has a `FUNDING.yml`. (#78)

### Changed

- **Performance** (old vs new bundle, measured in jsdom): the picker template
  is parsed once per page and cloned per instance (construction 2.0× faster);
  `render()` is a single pass over the grid and only touches the previously
  active cell's `tabindex`; day → cell lookup is O(1) instead of a 42-cell
  text scan; calendar icon/section elements are cached; range checks compare
  integer day keys instead of allocating a `Date` per cell; time is tracked
  as 24h components rather than re-parsed from the display text. Month
  navigation 1.57×, ranged navigation 1.58×, `reset()` 1.56× faster. (#78)
- Bundle size 24.1 KB → 21.9 KB (gzip 7.0 KB → 6.6 KB). (#78)
- `dist/*.d.ts` are regenerated as part of `npm run build`
  (`tsc --emitDeclarationOnly`), so published type declarations always match
  the source. (#78)
- Interactive demo page with an example for every shipped feature. (#53)

### Fixed

- Clicking the already-active calendar/time pane icon toggled the header
  fade, greying out the date display. (#78)
- `scrapeMonth()` was typed as returning `month: undefined`. (#78)
- "calender" typo in the user-visible tooltip. (#51)
- README: `el` is the mount container the picker is appended to, not a
  trigger element. (#49)

### Security

- The template is injected via `DOMParser` rather than `innerHTML`. (#43)
- `setTheme()` rejects prototype-polluting keys (`__proto__`, `constructor`,
  `prototype`), validates CSS custom-property names and blocks values that
  could exfiltrate data or execute expressions (`url()`, `image()`,
  `image-set()`, `expression()`). (#43)
- Time input values are parsed with explicit radix and clamped to valid
  ranges before constructing a `Date`. (#43)

## [1.1.0] - 2026-02-07

- First release published to npm as `easyepoch`: a modernized fork of
  [simplepicker](https://github.com/priyank-p/simplepicker) with TypeScript
  sources, an Rspack build, a Vitest suite, light/dark themes and CSS
  custom properties for theming. See the
  [v1.1.0 release](https://github.com/Christian-Oleson/EasyEpoch/releases/tag/v1.1.0).

[2.1.0]: https://github.com/Christian-Oleson/EasyEpoch/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/Christian-Oleson/EasyEpoch/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Christian-Oleson/EasyEpoch/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/Christian-Oleson/EasyEpoch/releases/tag/v1.1.0

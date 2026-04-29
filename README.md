# EasyEpoch

A lightweight datetime picker in vanilla JavaScript with zero dependencies.

[Live Examples](https://christian-oleson.github.io/EasyEpoch/)

EasyEpoch is a fork of [simplepicker](https://github.com/priyank-p/simplepicker) by Priyank Patel, originally based on [material-datetime-picker](https://github.com/ripjar/material-datetime-picker) but without relying on external dependencies like `moment`, `rome`, or `materialize`.

## Installation

Install from npm:
```
npm install easyepoch
```

## Usage

Include the CSS and JavaScript files from the `dist/` directory. The CSS file `dist/easyepoch.css` styles the picker, and the JavaScript file `dist/easyepoch.js` provides the picker logic.

If you use a bundler with `require` or ES6 `import`:

```javascript
import EasyEpoch from 'easyepoch';
```

For TypeScript:
```typescript
import EasyEpoch = require('easyepoch');
```

If you include the script directly via a `<script>` tag, `EasyEpoch` is available as a global variable.

TypeScript declaration files are included with the package.

## API

### `new EasyEpoch([el, opts])`

Creates a new picker instance and inserts it into the DOM.

- `el` (optional, `string` | `Element`) - The container element the picker is **appended to** (it does *not* replace the contents of `el`). Accepts a CSS selector string, a real DOM element, or omits to default to `<body>`. Each picker creates its own `.easyepoch-wrapper` overlay inside the container.
- `opts` (optional, `object`) - Configuration options:
  - `zIndex` (`number`): Sets the `z-index` for the picker.
  - `disableTimeSection` (`boolean`): If `true`, fully hides the time UI and excludes time from `selectedDate` (set to `00:00:00`) and from `readableDate`.
  - `compactMode` (`boolean`): If `true`, hides the large selected-date display for a more compact layout.
  - `selectedDate` (`Date`): Initialize the picker with this date. Defaults to today.
  - `minDate` (`Date`): Earliest selectable date (inclusive, by calendar day). Cells before this date are visually disabled and ignore clicks.
  - `maxDate` (`Date`): Latest selectable date (inclusive, by calendar day). Cells after this date are visually disabled and ignore clicks.
  - `showSeconds` (`boolean`): If `true`, the time picker accepts seconds and `selectedDate` / `readableDate` retain second-level precision.
  - `locale` (`object`): Translates labels and day/month names. See [Localization](#localization). Defaults to English.
  - `theme` (`'light'` | `'dark'` | `Record<string, string>`): Sets the color theme. Defaults to `'dark'`. See [Theming](#theming).

The first argument can be `opts` directly if no element is needed.

```javascript
const picker = new EasyEpoch();
```

`el` is the **mount point**, not the trigger. To open the picker on demand, wire up your own event:

```javascript
const picker = new EasyEpoch();
document.querySelector('#open-picker').addEventListener('click', () => picker.open());
```

To use multiple pickers on the same page, each must be bound to a different element:

```javascript
const picker1 = new EasyEpoch();
const picker2 = new EasyEpoch('.another-element');
```

Restricting selection to a date range:

```javascript
const today = new Date();
const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
const picker = new EasyEpoch({
  minDate: today,
  maxDate: oneYearFromNow,
});
```

Capturing seconds in the selected time:

```javascript
const picker = new EasyEpoch({ showSeconds: true });
picker.on('submit', (date, readable) => {
  console.log(date.getSeconds()); // preserved
  console.log(readable);          // e.g. "1st January 2024 02:30:45 PM"
});
```

### Keyboard shortcuts

While the picker is open, the following shortcuts are available:

| Key | Action |
|---|---|
| `←` / `→` | Move the selection back/forward by one day |
| `↑` / `↓` | Move the selection back/forward by one week |
| `Home` / `End` | Jump to the first / last day of the current month |
| `PageUp` / `PageDown` | Move back/forward by one month |
| `Shift` + `PageUp` / `PageDown` | Move back/forward by one year |
| `Enter` | Submit the current selection (same as `OK`) |
| `Escape` | Cancel and close (same as `Cancel`) |

Arrow keys are not intercepted while the time input has focus, so users can edit hours/minutes with the keyboard normally. Out-of-range cells (see `minDate` / `maxDate`) are skipped.

### `picker.open()`

Opens the picker. The picker closes automatically when the user clicks `Cancel` or the overlay, triggering the `close` event. If the user selects a date, the `submit` event fires instead.

### `picker.close()`

Closes the picker programmatically.

### `picker.reset(date)`

- `date` (optional, `Date`) - The date to select after reset. Defaults to `new Date()`.

Resets the picker to the given date. This overrides the user's current selection.

```javascript
const picker = new EasyEpoch();
picker.reset(new Date(2024, 11, 31, 7, 0, 0));
picker.open();
```

### `picker.on(event, handler)`

- `event` (required, `string`) - Event name: `submit` or `close`.
- `handler` (required, `function`) - Callback function.

Attaches an event listener. Multiple listeners per event are supported.

**Events:**

- **`submit`**: `handler(date, readableDate)` - Called when the user selects a date. `date` is a `Date` object, `readableDate` is a formatted string like `1st October 2024 12:00 AM`.
- **`close`**: `handler()` - Called when the user dismisses the picker via Cancel or the overlay.

### `picker.disableTimeSection()`

Disables the time picker section.

### `picker.enableTimeSection()`

Re-enables the time picker section if previously disabled.

### `picker.setTheme(theme)`

- `theme` (required, `'light'` | `'dark'` | `Record<string, string>`) - The theme to apply.

Switches the picker's theme at runtime. Accepts a built-in theme name or a custom theme object.

```javascript
picker.setTheme('light');
picker.setTheme('dark');
picker.setTheme({ bg: '#0a0a0a', primary: '#ff6b6b', text: '#f0f0f0' });
```

### `picker.setMinDate(date?)` / `picker.setMaxDate(date?)`

- `date` (optional, `Date`) - New lower / upper bound. Pass `undefined` (or no argument) to clear the bound.

Updates the picker's selectable range and re-renders the visible month so out-of-range cells become non-clickable immediately. The active selection is preserved if it's still on the visible month and in range; otherwise the active highlight is cleared (the `selectedDate` property itself is left alone).

### `picker.linkAfter(other)` / `picker.linkBefore(other)`

- `other` (required, `EasyEpoch`) - The picker whose selection drives this picker's bound.

`linkAfter` makes this picker's `minDate` track `other.selectedDate`: every time `other` submits, this picker's lower bound advances to the date the user just confirmed. `linkBefore` is the mirror — this picker's `maxDate` tracks `other.selectedDate`. The link applies the source's current `selectedDate` immediately, so it works even if `other` already has a date set when you call `linkAfter`. Both methods return the linked instance for chaining.

Bounds are inclusive: same-day selections in both pickers are allowed.

```javascript
const start = new EasyEpoch('#start');
const end = new EasyEpoch('#end');
end.linkAfter(start);   // end >= start
start.linkBefore(end);  // start <= end
```

### `EasyEpoch.linkRange(start, end)`

Sugar for the from/to pattern. Equivalent to:

```javascript
end.linkAfter(start);
start.linkBefore(end);
```

```javascript
const start = new EasyEpoch('#start');
const end = new EasyEpoch('#end');
EasyEpoch.linkRange(start, end);
```

## Theming

EasyEpoch uses CSS custom properties for all colors and visual styles. The dark theme is the default.

### Built-in themes

Pass a theme name via the constructor or `setTheme()`:

```javascript
const picker = new EasyEpoch({ theme: 'light' });

// Switch at runtime
picker.setTheme('dark');
```

### Custom theme objects

Pass an object whose keys are CSS variable names (with or without the `--easyepoch-` prefix):

```javascript
picker.setTheme({
  bg: '#0a0a0a',
  primary: '#ff6b6b',
  secondary: '#ffd93d',
  accent: '#ff6b6b',
  text: '#f0f0f0',
});
```

### CSS-only override

You can also override variables directly in your own stylesheet without any JavaScript:

```css
.easyepoch-wrapper {
  --easyepoch-primary: #ff6b6b;
  --easyepoch-secondary: #ffd93d;
  --easyepoch-bg: #0a0a0a;
}
```

### Available CSS custom properties

| Variable | Description |
|---|---|
| `--easyepoch-bg` | Picker body background |
| `--easyepoch-text` | Primary text color |
| `--easyepoch-text-secondary` | Subdued text (table headers) |
| `--easyepoch-text-muted` | Faded/disabled text |
| `--easyepoch-primary` | Primary accent color |
| `--easyepoch-secondary` | Secondary accent color |
| `--easyepoch-accent` | Button/icon tint color |
| `--easyepoch-header-bg` | Day-of-week header background |
| `--easyepoch-date-section-bg` | Date display section background |
| `--easyepoch-selected-bg` | Active date cell / button hover background |
| `--easyepoch-hover-bg` | Date cell hover background |
| `--easyepoch-border` | Border/divider color |
| `--easyepoch-overlay-bg` | Backdrop overlay color |
| `--easyepoch-shadow` | Picker box shadow |
| `--easyepoch-cell-text` | Calendar cell text color |
| `--easyepoch-cell-hover-text` | Calendar cell hover text color |
| `--easyepoch-cell-active-text` | Active/selected cell text color |
| `--easyepoch-input-border` | Time input border color |
| `--easyepoch-btn-hover-text` | Button hover text color |

## Localization

EasyEpoch ships with English defaults but every visible string can be replaced via the `locale` option. Anything you don't override falls back to the English default.

```javascript
const picker = new EasyEpoch({
  locale: {
    months: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ],
    days: [
      'Dimanche', 'Lundi', 'Mardi', 'Mercredi',
      'Jeudi', 'Vendredi', 'Samedi',
    ],
    daysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    ok: 'Valider',
    cancel: 'Annuler',
  },
});
```

| Field | Used for | Default |
|---|---|---|
| `months` | Month name in the date header (12 entries, January..December order) | English month names |
| `days` | Day-of-week label above the calendar (7 entries, Sunday..Saturday order) | English day names |
| `daysShort` | Calendar table column headers (7 entries, Sunday..Saturday order) | `Sun..Sat` |
| `ok` | OK button label | `OK` |
| `cancel` | Cancel button label | `Cancel` |
| `selectDateTitle` | Tooltip on the calendar-icon toggle button | English |
| `selectTimeTitle` | Tooltip on the time-icon toggle button | English |
| `okTitle` | Tooltip on the OK button | Mirrors `ok` if you set `ok`, otherwise English |
| `cancelTitle` | Tooltip on the Cancel button | Mirrors `cancel` if you set `cancel`, otherwise English |
| `previousMonthTitle` | Tooltip + ARIA label on the previous-month button | `Previous month` |
| `nextMonthTitle` | Tooltip + ARIA label on the next-month button | `Next month` |
| `dialogLabel` | Accessible name for the dialog itself (announced when the picker opens) | `Date picker` |

The rendered time display always uses a 12-hour clock with `AM` / `PM` suffixes. `showSeconds` only controls precision, not the clock format. The browser's native `<input type="time">` widget may display in 24-hour form while the user is editing (browsers honor the OS locale here), but EasyEpoch's `selectedDate` is a normal `Date` so you can format it in any timezone/locale yourself in the `submit` handler.

## Accessibility

EasyEpoch is built to work with screen readers and keyboard-only users without any extra wiring on your part.

- The picker overlay is a proper modal dialog: `role="dialog"`, `aria-modal="true"`, with an accessible name from `locale.dialogLabel` (default: `"Date picker"`).
- The calendar table is announced as a grid (`role="grid"`), with `role="gridcell"` on every cell, `scope="col"` on the day-of-week headers, and `role="row"` on each row.
- The selected cell carries `aria-selected="true"`. Out-of-range cells (when `minDate` / `maxDate` is set) and empty cells get `aria-disabled="true"`.
- Icon-only buttons (calendar/time toggle, prev/next month) carry both a `title` and an `aria-label` from the locale, so assistive tech announces what each button does.
- SVG icons are marked `aria-hidden="true"` so they aren't double-announced.

**Focus management**

- When `picker.open()` is called, EasyEpoch remembers the element that had focus and moves focus to the active calendar cell.
- When the picker closes (OK, Cancel, overlay click, Escape, or `picker.close()`), focus is restored to whichever element had it before.
- `Tab` and `Shift`+`Tab` are trapped within the dialog so keyboard users can't accidentally tab out into the page behind the modal.

**Calendar grid keyboard pattern**

The calendar grid uses the standard ARIA roving-tabindex pattern: only the active cell is in the tab sequence (`tabindex="0"`); all others are `tabindex="-1"`. Arrow / Home / End / PageUp/Dn move the active cell and follow it with focus, so screen readers announce the new date as the user navigates. See [Keyboard shortcuts](#keyboard-shortcuts) for the full key map.

If you customize the picker via `setTheme()` and override `--easyepoch-primary`, the focus ring on cells and buttons inherits that color automatically.

## Development

```bash
npm start        # Dev server with hot reload
npm run build    # Production build
npm test         # Run tests
```

## License

MIT - See [LICENSE](./LICENSE) for details.

Originally created by [Priyank Patel](https://github.com/priyank-p). Forked and maintained as EasyEpoch by [Christian Oleson](https://github.com/Christian-Oleson).

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

## Development

```bash
npm start        # Dev server with hot reload
npm run build    # Production build
npm test         # Run tests
```

## License

MIT - See [LICENSE](./LICENSE) for details.

Originally created by [Priyank Patel](https://github.com/priyank-p). Forked and maintained as EasyEpoch by [Christian Oleson](https://github.com/Christian-Oleson).

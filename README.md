# ChronosJS

A lightweight datetime picker in vanilla JavaScript with zero dependencies.

ChronosJS is a fork of [simplepicker](https://github.com/priyank-p/simplepicker) by Priyank Patel, originally based on [material-datetime-picker](https://github.com/ripjar/material-datetime-picker) but without relying on external dependencies like `moment`, `rome`, or `materialize`.

## Installation

Install from npm:
```
npm install chronosjs
```

## Usage

Include the CSS and JavaScript files from the `dist/` directory. The CSS file `dist/simplepicker.css` styles the picker, and the JavaScript file `dist/simplepicker.js` provides the picker logic.

If you use a bundler with `require` or ES6 `import`:

```javascript
import SimplePicker from 'chronosjs';
```

For TypeScript:
```typescript
import SimplePicker = require('chronosjs');
```

If you include the script directly via a `<script>` tag, `SimplePicker` is available as a global variable.

TypeScript declaration files are included with the package.

## API

### `new SimplePicker([el, opts])`

Creates a new picker instance and inserts it into the DOM.

- `el` (optional, `string` | `Element`) - A CSS selector or DOM element to bind the picker to. Defaults to `body`.
- `opts` (optional, `object`) - Configuration options:
  - `zIndex` (`number`): Sets the `z-index` for the picker.
  - `disableTimeSection` (`boolean`): If `true`, disables the time picker section.
  - `compactMode` (`boolean`): If `true`, hides the large selected-date display for a more compact layout.
  - `selectedDate` (`Date`): Initialize the picker with this date. Defaults to today.

The first argument can be `opts` directly if no element is needed.

```javascript
const picker = new SimplePicker();
```

To use multiple pickers on the same page, each must be bound to a different element:

```javascript
const picker1 = new SimplePicker();
const picker2 = new SimplePicker('.another-element');
```

### `picker.open()`

Opens the picker. The picker closes automatically when the user clicks `Cancel` or the overlay, triggering the `close` event. If the user selects a date, the `submit` event fires instead.

### `picker.close()`

Closes the picker programmatically.

### `picker.reset(date)`

- `date` (optional, `Date`) - The date to select after reset. Defaults to `new Date()`.

Resets the picker to the given date. This overrides the user's current selection.

```javascript
const picker = new SimplePicker();
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

## Development

```bash
npm start        # Dev server with hot reload
npm run build    # Production build
npm test         # Run tests
```

## License

MIT - See [LICENSE](./LICENSE) for details.

Originally created by [Priyank Patel](https://github.com/priyank-p). Forked and maintained as ChronosJS by [Christian Oleson](https://github.com/Christian-Oleson).

# EasyEpoch Theming System — Implementation Plan

## Overview

EasyEpoch currently has all styles hardcoded in `lib/easyepoch.css` with no customization mechanism. This plan introduces a CSS custom properties (CSS variables) based theming system with built-in light and dark themes, a programmatic API for custom themes, and a theme toggle in the docs example page.

---

## Design Principles

- **Zero new dependencies** — stays consistent with the library's vanilla JS philosophy
- **Backwards compatible** — the current dark appearance becomes the default `dark` theme; existing users see no change
- **CSS custom properties** — all themeable values are expressed as `--easyepoch-*` variables, making override trivial from consumer CSS
- **Minimal JS surface** — theme switching is a class swap + optional variable injection, not a re-render

---

## Step 1: Extract CSS Custom Properties

**File:** `lib/easyepoch.css`

Convert all hardcoded color/style values into CSS custom properties scoped under `.easyepoch-wrapper`. This is the foundation everything else builds on.

### Variables to extract

| Variable | Purpose | Dark value | Light value |
|---|---|---|---|
| `--easyepoch-bg` | Picker body background | `#1e2030` | `#ffffff` |
| `--easyepoch-text` | Primary text color | `#e0e0e0` | `#1e293b` |
| `--easyepoch-text-secondary` | Subdued text (table headers, etc.) | `#94a3b8` | `#64748b` |
| `--easyepoch-text-muted` | Faded/disabled text | `rgba(255,255,255,0.3)` | `rgba(0,0,0,0.25)` |
| `--easyepoch-primary` | Primary accent (cyan) | `#06b6d4` | `#0891b2` |
| `--easyepoch-secondary` | Secondary accent (purple) | `#7c3aed` | `#7c3aed` |
| `--easyepoch-accent` | Button/icon tint | `#c4b5fd` | `#7c3aed` |
| `--easyepoch-header-bg` | Header gradient start | `linear-gradient(135deg, #7c3aed, #06b6d4)` | `linear-gradient(135deg, #7c3aed, #06b6d4)` |
| `--easyepoch-date-section-bg` | Date section gradient | `linear-gradient(135deg, #0d9488, #7c3aed)` | `linear-gradient(135deg, #0d9488, #7c3aed)` |
| `--easyepoch-selected-bg` | Active date cell gradient | `linear-gradient(135deg, #06b6d4, #7c3aed)` | `linear-gradient(135deg, #06b6d4, #7c3aed)` |
| `--easyepoch-hover-bg` | Hover state on date cells | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` |
| `--easyepoch-border` | Subtle borders/dividers | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |
| `--easyepoch-overlay-bg` | Backdrop overlay | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.3)` |
| `--easyepoch-shadow` | Box shadow | `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)` | `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)` |
| `--easyepoch-cell-text` | Calendar cell text | `#cbd5e1` | `#334155` |
| `--easyepoch-cell-hover-text` | Calendar cell hover text | `#fff` | `#0f172a` |
| `--easyepoch-input-border` | Time input border | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` |
| `--easyepoch-btn-hover-text` | Button hover text | `#fff` | `#fff` |

### How it works in the CSS

```css
/* Default (dark) variables on the wrapper */
.easyepoch-wrapper {
  --easyepoch-bg: #1e2030;
  --easyepoch-text: #e0e0e0;
  /* ... all variables ... */
}

/* Rules reference variables instead of hardcoded values */
.easyepoch-date-picker {
  background-color: var(--easyepoch-bg);
  color: var(--easyepoch-text);
  box-shadow: var(--easyepoch-shadow);
}
```

### SVG icon handling

The base64-encoded SVG icons in the CSS use hardcoded stroke colors (`#c4b5fd` and `white`). These will be replaced with inline SVGs in the template (`lib/template.ts`) that use `currentColor`, allowing them to inherit color from CSS custom properties. This is a cleaner approach than maintaining multiple base64 strings per theme.

---

## Step 2: Define Built-in Theme Classes

**File:** `lib/easyepoch.css`

Add a `.easyepoch-theme-light` class that overrides the default (dark) CSS variable values.

```css
/* Light theme overrides */
.easyepoch-wrapper.easyepoch-theme-light {
  --easyepoch-bg: #ffffff;
  --easyepoch-text: #1e293b;
  --easyepoch-text-secondary: #64748b;
  --easyepoch-text-muted: rgba(0,0,0,0.25);
  --easyepoch-primary: #0891b2;
  --easyepoch-accent: #7c3aed;
  --easyepoch-hover-bg: rgba(0,0,0,0.06);
  --easyepoch-border: rgba(0,0,0,0.08);
  --easyepoch-overlay-bg: rgba(0,0,0,0.3);
  --easyepoch-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
  --easyepoch-cell-text: #334155;
  --easyepoch-cell-hover-text: #0f172a;
  --easyepoch-input-border: rgba(0,0,0,0.15);
}
```

The dark theme is the default (no extra class needed), keeping backwards compatibility. An explicit `.easyepoch-theme-dark` class will also be provided for symmetry, but it will be a no-op since dark values are the defaults.

---

## Step 3: Add `theme` Option to Constructor

**File:** `lib/index.ts`

### 3a. Extend the options interface

```typescript
interface EasyEpochOpts {
  zIndex?: number;
  compactMode?: boolean;
  disableTimeSection?: boolean;
  selectedDate?: Date;
  theme?: 'light' | 'dark' | Record<string, string>;  // NEW
}
```

### 3b. Apply theme in `init()`

In the `init()` method, after the wrapper element is resolved:

```typescript
if (opts.theme === 'light') {
  this.$easyepochWrapper.classList.add('easyepoch-theme-light');
} else if (opts.theme && typeof opts.theme === 'object') {
  // Custom theme: apply CSS variables directly
  for (const [key, value] of Object.entries(opts.theme)) {
    const varName = key.startsWith('--') ? key : `--easyepoch-${key}`;
    this.$easyepochWrapper.style.setProperty(varName, value);
  }
}
```

### 3c. Add public `setTheme()` method

Allow runtime theme switching after construction:

```typescript
setTheme(theme: 'light' | 'dark' | Record<string, string>): void {
  // Remove any existing theme class
  this.$easyepochWrapper.classList.remove('easyepoch-theme-light', 'easyepoch-theme-dark');
  // Clear any inline custom properties from a previous custom theme
  this.$easyepochWrapper.style.cssText = this.$easyepochWrapper.style.cssText
    .replace(/--easyepoch-[^;]+;/g, '');

  if (theme === 'light') {
    this.$easyepochWrapper.classList.add('easyepoch-theme-light');
  } else if (theme === 'dark') {
    // dark is default, no class needed (but add for explicitness)
    this.$easyepochWrapper.classList.add('easyepoch-theme-dark');
  } else if (typeof theme === 'object') {
    for (const [key, value] of Object.entries(theme)) {
      const varName = key.startsWith('--') ? key : `--easyepoch-${key}`;
      this.$easyepochWrapper.style.setProperty(varName, value);
    }
  }
}
```

---

## Step 4: Update SVG Icons to Use `currentColor`

**File:** `lib/template.ts` and `lib/easyepoch.css`

Replace the base64-encoded background-image SVGs with inline SVG elements in the HTML template. This lets icons inherit color from CSS properties.

**In `template.ts`**, the icon buttons change from empty buttons to buttons containing inline SVGs:

```html
<button type="button" class="easyepoch-icon easyepoch-icon-previous" title="Previous month">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
</button>
```

**In `easyepoch.css`**, remove the `background-image` declarations from `.easyepoch-icon-next`, `.easyepoch-icon-previous`, `.easyepoch-icon-calender`, `.easyepoch-icon-time` and instead set the icon color:

```css
.easyepoch-icon svg {
  color: var(--easyepoch-accent);
}
.easyepoch-icon-calender svg,
.easyepoch-icon-time svg {
  color: var(--easyepoch-text);
}
```

---

## Step 5: Add Theme Toggle to Docs Example Page

**File:** `docs/index.html`

### 5a. Add a new "Theming" example section

Insert a new example card (before or after the existing examples) that demonstrates theming:

```html
<!-- Example: Theming -->
<div class="example">
  <div class="example-header">
    <h2>Theming</h2>
    <p>Switch between light and dark themes, or apply a custom theme.</p>
  </div>
  <div class="example-demo">
    <div class="demo-row">
      <button class="demo-btn" id="theme-toggle-btn">Toggle Light / Dark</button>
      <button class="demo-btn" id="theme-open-btn">Open Picker</button>
    </div>
    <div class="demo-output" id="theme-output">Current theme: dark</div>
  </div>
  <div class="example-code">...</div>
</div>
```

### 5b. Add toggle logic

```javascript
(function() {
  var picker = new EasyEpoch({ zIndex: 10 });
  var isDark = true;
  var toggleBtn = document.getElementById('theme-toggle-btn');
  var openBtn = document.getElementById('theme-open-btn');
  var output = document.getElementById('theme-output');

  openBtn.addEventListener('click', function() { picker.open(); });

  toggleBtn.addEventListener('click', function() {
    isDark = !isDark;
    picker.setTheme(isDark ? 'dark' : 'light');
    output.textContent = 'Current theme: ' + (isDark ? 'dark' : 'light');
  });

  picker.on('submit', function(date, readableDate) {
    output.textContent = 'Selected: ' + readableDate;
  });
})();
```

---

## Step 6: Update Type Declarations

**File:** `easyepoch.d.ts`

Update the root-level declaration file to include the new `theme` option and `setTheme` method:

```typescript
interface EasyEpochOpts {
  zIndex?: number;
  compactMode?: boolean;
  disableTimeSection?: boolean;
  selectedDate?: Date;
  theme?: 'light' | 'dark' | Record<string, string>;
}

// In the class declaration:
setTheme(theme: 'light' | 'dark' | Record<string, string>): void;
```

---

## Step 7: Write Tests

**File:** `tests/easyepoch.test.ts`

Add test cases for:

1. **Default theme** — no theme class added, wrapper uses dark variables
2. **`theme: 'light'` option** — wrapper has `.easyepoch-theme-light` class
3. **`theme: 'dark'` option** — wrapper has `.easyepoch-theme-dark` class (explicit)
4. **Custom theme object** — wrapper has inline CSS custom properties set
5. **`setTheme()` runtime switching** — switching from dark to light adds class, switching from light to custom applies variables, switching from custom back to dark cleans up inline variables
6. **SVG icons render** — icon buttons contain `<svg>` elements instead of relying on background images

---

## Step 8: Build & Verify

1. Run `npm run build` to compile and ensure the CSS is copied to `dist/`
2. Run `npm test` to verify all existing + new tests pass
3. Manually verify `docs/index.html` in a browser: dark/light toggle works, custom theme applies, all existing examples still look correct

---

## Summary of Files Changed

| File | Change |
|---|---|
| `lib/easyepoch.css` | Extract hardcoded values to CSS custom properties; add `.easyepoch-theme-light` class; remove base64 icon backgrounds; add icon SVG color rules |
| `lib/index.ts` | Add `theme` option to `EasyEpochOpts`; apply theme class/variables in `init()`; add `setTheme()` public method |
| `lib/template.ts` | Replace empty icon buttons with inline SVG icons using `currentColor` |
| `docs/index.html` | Add theming example with light/dark toggle button |
| `easyepoch.d.ts` | Add `theme` option and `setTheme()` to type declarations |
| `tests/easyepoch.test.ts` | Add theme-related test cases |

---

## API Usage Examples

### Built-in theme via constructor
```javascript
const picker = new EasyEpoch({ theme: 'light' });
```

### Runtime theme switch
```javascript
picker.setTheme('dark');
picker.setTheme('light');
```

### Fully custom theme
```javascript
picker.setTheme({
  bg: '#0a0a0a',
  primary: '#ff6b6b',
  secondary: '#ffd93d',
  accent: '#ff6b6b',
  text: '#f0f0f0',
});
```

### CSS-only override (no JS needed)
```css
.easyepoch-wrapper {
  --easyepoch-primary: #ff6b6b;
  --easyepoch-secondary: #ffd93d;
}
```

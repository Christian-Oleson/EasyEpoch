import * as dateUtil from './date-util';
import { MonthData, MonthTracker } from './date-util';
import { htmlTemplate } from './template';

type EasyEpochEvent = 'submit' | 'close';
type EasyEpochTheme = 'light' | 'dark' | Record<string, string>;

interface EasyEpochLocale {
  // 12 month names, January..December
  months?: string[];
  // 7 full day names, Sunday..Saturday (used in the day-of-week header)
  days?: string[];
  // 7 short day names, Sun..Sat (used as calendar table column headers)
  daysShort?: string[];
  // Button labels
  ok?: string;
  cancel?: string;
  // Tooltip titles for the icon/action buttons (mouse-hover and the default
  // accessible name when no separate aria-label is given).
  selectDateTitle?: string;
  selectTimeTitle?: string;
  okTitle?: string;
  cancelTitle?: string;
  previousMonthTitle?: string;
  nextMonthTitle?: string;
  // Accessible name for the dialog as a whole, announced to screen readers
  // when the picker opens.
  dialogLabel?: string;
}

type ResolvedLocale = Required<EasyEpochLocale>;

const defaultLocale: ResolvedLocale = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  days: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ],
  daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ok: 'OK',
  cancel: 'Cancel',
  selectDateTitle: 'Select date from calendar!',
  selectTimeTitle: 'Select time',
  okTitle: 'OK',
  cancelTitle: 'Cancel',
  previousMonthTitle: 'Previous month',
  nextMonthTitle: 'Next month',
  dialogLabel: 'Date picker',
};

interface EasyEpochOpts {
  zIndex?: number;
  compactMode?: boolean;
  disableTimeSection?: boolean;
  selectedDate?: Date;
  theme?: EasyEpochTheme;
  minDate?: Date;
  maxDate?: Date;
  showSeconds?: boolean;
  locale?: EasyEpochLocale;
}

const validListeners = [
  'submit',
  'close',
] as const;

type HandlerFunction = (...args: unknown[]) => void;
interface EventHandlers {
  [key: string]: HandlerFunction[];
}

// The picker markup is parsed once per page and then cloned per instance:
// cloning a DOM subtree is far cheaper than re-parsing the HTML string every
// time a picker is constructed, and it is what dominated construction cost.
let templateWrapper: HTMLElement | null = null;

function getTemplateWrapper(): HTMLElement {
  if (!templateWrapper) {
    // DOMParser (not innerHTML) so static analysis (CodeQL js/xss-through-dom)
    // can see the constant markup never touches the live document directly.
    const doc = new DOMParser().parseFromString(htmlTemplate, 'text/html');
    templateWrapper = doc.querySelector('.easyepoch-wrapper') as HTMLElement;
  }
  return templateWrapper;
}

class EasyEpoch {
  selectedDate: Date;
  $easyEpoch: HTMLElement;
  readableDate: string;
  _eventHandlers: EventHandlers;
  _validOnListeners = validListeners;

  private opts: EasyEpochOpts;
  private $: (sel: string) => HTMLElement;
  private $$: (sel: string) => NodeListOf<HTMLElement>;
  private $easyepoch: HTMLElement;
  private $easyepochWrapper: HTMLElement;
  private $trs: HTMLElement[];
  private $tds: HTMLElement[];
  private $lastRow: HTMLElement;
  private $headerMonthAndYear: HTMLElement;
  private $monthAndYear: HTMLElement;
  private $date: HTMLElement;
  private $day: HTMLElement;
  private $time: HTMLElement;
  private $timeInput: HTMLInputElement;
  private $timeSectionIcon: HTMLElement;
  private $cancel: HTMLElement;
  private $ok: HTMLElement;
  private $displayDateElements: HTMLElement[];
  private $activeCell: HTMLElement | null;
  private $timeSection: HTMLElement;
  private $timeDisplay: HTMLElement;
  private $calenderIcon: HTMLElement;
  private $calenderSection: HTMLElement;
  private monthTracker: MonthTracker;
  private timeSectionDisabled: boolean;
  private showSeconds: boolean;
  // Selectable range as integer day keys (see dayKey). Comparing integers
  // lets render() range-check 31 cells without allocating a Date per cell.
  private minKey?: number;
  private maxKey?: number;
  // Layout of the month currently on screen: the cell index holding the 1st
  // and the number of days. Together they make day -> cell an O(1) index
  // lookup instead of a 42-cell text scan.
  private firstDayOffset = 0;
  private daysInMonth = 0;
  // Time state as 24h components. The display string and selectedDate are
  // derived from these instead of being parsed back out of the DOM.
  private hours = 12;
  private minutes = 0;
  private seconds = 0;
  private timeText = '12:00 PM';
  private locale: ResolvedLocale;
  private previouslyFocused: HTMLElement | null = null;
  private destroyed = false;

  constructor(arg1?: HTMLElement | string | EasyEpochOpts, arg2?: EasyEpochOpts) {
    let el: HTMLElement | undefined = undefined;
    let opts: EasyEpochOpts | undefined = arg2;

    if (typeof arg1 === 'string') {
      const element = <HTMLElement> document.querySelector(arg1);
      if (element !== null) {
        el = element;
      } else {
        throw new Error('Invalid selector passed to EasyEpoch!');
      }
    } else if (arg1 instanceof HTMLElement) {
      el = arg1;
    } else if (typeof arg1 === 'object') {
      opts = arg1 as EasyEpochOpts;
    }

    if (!el) {
      el = <HTMLElement> document.querySelector('body');
    }

    if (!opts) {
      opts = {};
    }

    this.selectedDate = new Date();
    this.monthTracker = dateUtil.createMonthTracker();
    const wrapper = this.injectTemplate(el);
    this.init(wrapper, opts);
    this.initListeners();

    this._eventHandlers = {};
  }

  // We use $, $$ as helper method to conviently select
  // element we need for easyepoch.
  // Also, Limit the query to the wrapper class to avoid
  // selecting elements on the other instance.
  initElMethod(el: HTMLElement) {
    this.$ = (sel: string) => el.querySelector(sel) as HTMLElement;
    this.$$ = (sel: string) => el.querySelectorAll(sel);
  }

  init(wrapper: HTMLElement, opts: EasyEpochOpts) {
    this.$easyepochWrapper = wrapper;
    this.initElMethod(wrapper);

    const { $, $$ } = this;
    this.$easyepoch = $('.easyepoch-date-picker');
    this.$trs = Array.from($$('.easyepoch-calender tbody tr'));
    this.$tds = Array.from($$('.easyepoch-calender tbody td'));
    this.$lastRow = this.$trs[this.$trs.length - 1];
    this.$headerMonthAndYear = $('.easyepoch-month-and-year');
    this.$monthAndYear = $('.easyepoch-selected-date');
    this.$date = $('.easyepoch-date');
    this.$day = $('.easyepoch-day-header');
    this.$time = $('.easyepoch-time');
    this.$timeInput = $('.easyepoch-time-section input') as HTMLInputElement;
    this.$timeSection = $('.easyepoch-time-section');
    this.$timeSectionIcon = $('.easyepoch-icon-time');
    this.$timeDisplay = this.$time;
    this.$calenderIcon = $('.easyepoch-icon-calender');
    this.$calenderSection = $('.easyepoch-calender-section');
    this.$cancel = $('.easyepoch-cancel-btn');
    this.$ok = $('.easyepoch-ok-btn');

    this.$displayDateElements = [
      this.$day,
      this.$headerMonthAndYear,
      this.$date
    ];

    this.$activeCell = null;

    this.$time.classList.add('easyepoch-fade');

    opts = opts || {};
    this.opts = opts;

    this.timeSectionDisabled = false;
    this.showSeconds = opts.showSeconds === true;
    this.minKey = opts.minDate ? EasyEpoch.dayKey(opts.minDate) : undefined;
    this.maxKey = opts.maxDate ? EasyEpoch.dayKey(opts.maxDate) : undefined;
    // Locale must be set before the first render so updateDateComponents can
    // read this.locale.months / this.locale.days when laying out the header.
    this.locale = this.resolveLocale(opts.locale);
    this.applyLocaleStrings();

    if (this.showSeconds) {
      this.$timeInput.setAttribute('step', '1');
      this.$timeInput.value = '12:00:00';
    }

    // reset() renders the month of the initial date itself, so rendering
    // "now" first would just be thrown away.
    this.reset(opts.selectedDate || new Date());

    if (opts.zIndex !== undefined) {
      this.$easyepochWrapper.style.zIndex = opts.zIndex.toString();
    }

    if (opts.disableTimeSection) {
      this.disableTimeSection();
    }

    if (opts.compactMode) {
      this.compactMode();
    }

    this.setTheme(opts.theme || 'dark');
  }

  // Collapse a calendar day to an integer that orders the same way dates do
  // (year * 10000 + month * 100 + day). Only used for comparisons.
  private static dayKey(y: number | Date, m?: number, d?: number): number {
    if (y instanceof Date) {
      return y.getFullYear() * 10000 + y.getMonth() * 100 + y.getDate();
    }
    return y * 10000 + (m as number) * 100 + (d as number);
  }

  private resolveLocale(input?: EasyEpochLocale): ResolvedLocale {
    // Build the merged locale explicitly rather than spreading. The spread
    // approach would let `{ months: undefined }` blow away the default and
    // leave updateDateComponents/updateSelectedDate indexing into undefined.
    // We accept a per-field override only if it's a non-undefined value of
    // the right shape; otherwise we keep the default.
    const validArr = (v: unknown, length: number): string[] | undefined => {
      if (!Array.isArray(v) || v.length !== length) return undefined;
      // All entries must be strings; one bad entry would surface as undefined later.
      for (let i = 0; i < length; i++) {
        if (typeof v[i] !== 'string') return undefined;
      }
      return v as string[];
    };
    const validStr = (v: unknown): string | undefined =>
      typeof v === 'string' && v.length > 0 ? v : undefined;

    const i = input || {};
    const months = validArr(i.months, 12) ?? defaultLocale.months;
    const days = validArr(i.days, 7) ?? defaultLocale.days;
    const daysShort = validArr(i.daysShort, 7) ?? defaultLocale.daysShort;
    const ok = validStr(i.ok) ?? defaultLocale.ok;
    const cancel = validStr(i.cancel) ?? defaultLocale.cancel;

    // Mirror label -> title when the user provides only the label, so tooltips
    // don't revert to English on hover.
    const okTitle = validStr(i.okTitle) ?? (validStr(i.ok) !== undefined ? ok : defaultLocale.okTitle);
    const cancelTitle = validStr(i.cancelTitle) ?? (validStr(i.cancel) !== undefined ? cancel : defaultLocale.cancelTitle);
    const selectDateTitle = validStr(i.selectDateTitle) ?? defaultLocale.selectDateTitle;
    const selectTimeTitle = validStr(i.selectTimeTitle) ?? defaultLocale.selectTimeTitle;
    const previousMonthTitle = validStr(i.previousMonthTitle) ?? defaultLocale.previousMonthTitle;
    const nextMonthTitle = validStr(i.nextMonthTitle) ?? defaultLocale.nextMonthTitle;
    const dialogLabel = validStr(i.dialogLabel) ?? defaultLocale.dialogLabel;

    return {
      months, days, daysShort,
      ok, cancel,
      selectDateTitle, selectTimeTitle, okTitle, cancelTitle,
      previousMonthTitle, nextMonthTitle, dialogLabel,
    };
  }

  private applyLocaleStrings() {
    const { locale } = this;
    // Calendar table column headers: 7 <th> in the <thead>.
    const ths = this.$$('.easyepoch-calender thead th');
    if (locale.daysShort.length === 7) {
      for (let i = 0; i < 7 && i < ths.length; i++) {
        ths[i].textContent = locale.daysShort[i];
      }
    }

    // OK / Cancel button labels and tooltips.
    this.$ok.textContent = locale.ok;
    this.$ok.setAttribute('title', locale.okTitle);
    this.$cancel.textContent = locale.cancel;
    this.$cancel.setAttribute('title', locale.cancelTitle);

    // Set both `title` (mouse hover) and `aria-label` (assistive tech) on every
    // icon button. Screen readers announce the aria-label; sighted users hover
    // for the title. Both use the same string for now.
    const setIconLabels = (sel: string, label: string) => {
      const el = this.$(sel);
      if (!el) return;
      el.setAttribute('title', label);
      el.setAttribute('aria-label', label);
    };
    setIconLabels('.easyepoch-icon-calender', locale.selectDateTitle);
    setIconLabels('.easyepoch-icon-time', locale.selectTimeTitle);
    setIconLabels('.easyepoch-icon-previous', locale.previousMonthTitle);
    setIconLabels('.easyepoch-icon-next', locale.nextMonthTitle);

    // Dialog accessible name.
    this.$easyepochWrapper.setAttribute('aria-label', locale.dialogLabel);
  }

  private isDateOutOfRange(year: number, month: number, day: number): boolean {
    const { minKey, maxKey } = this;
    if (minKey === undefined && maxKey === undefined) return false;
    const key = EasyEpoch.dayKey(year, month, day);
    return (minKey !== undefined && key < minKey) || (maxKey !== undefined && key > maxKey);
  }

  // Reset by selecting current date.
  reset(newDate?: Date) {
    const date = newDate || new Date();
    this.render(dateUtil.scrapeMonth(date, this.monthTracker));

    this.setTime(date.getHours(), date.getMinutes(), this.showSeconds ? date.getSeconds() : 0);

    const dateString = date.getDate().toString();
    const $dateEl = this.findElementWithDate(dateString);
    if ($dateEl && !$dateEl.classList.contains('active')) {
      this.selectDateElement($dateEl);
      this.updateDateComponents(date);
    }
  }

  // Single writer for the time state: keeps the 24h components, the
  // <input type="time"> value and the AM/PM display text in sync. syncInput
  // is false when the change originated from the input itself, so we don't
  // write a value back into a control the user is mid-way through editing.
  private setTime(hours: number, minutes: number, seconds: number, syncInput: boolean = true) {
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
    if (syncInput) {
      this.$timeInput.value = dateUtil.formatTimeInputValue(hours, minutes, seconds, this.showSeconds);
    }
    this.timeText = dateUtil.formatTime(hours, minutes, seconds, this.showSeconds);
    this.$time.textContent = this.timeText;
  }

  compactMode() {
    const { $date } = this;
    $date.style.display = 'none';
  }

  disableTimeSection() {
    this.timeSectionDisabled = true;
    this.$timeSectionIcon.style.display = 'none';
    this.$timeDisplay.style.display = 'none';
    this.$timeSection.style.display = 'none';
    // Force the calendar pane to be the visible one so the user can't be stranded
    // on a hidden time pane if disable was toggled while time was active.
    this.$calenderIcon.classList.add('active');
    this.$timeSectionIcon.classList.remove('active');
    this.$calenderSection.style.display = 'block';
    this.updateSelectedDate();
  }

  enableTimeSection() {
    this.timeSectionDisabled = false;
    this.$timeSectionIcon.style.display = '';
    this.$timeDisplay.style.display = '';
    // The time section itself stays display:none until the user clicks the time icon.
    this.updateSelectedDate();
  }

  // Runtime setters for the date range. Pass `undefined` to clear the bound.
  // Re-renders the currently displayed month so cells immediately reflect the
  // new constraint. The previously-selected cell stays selected if it's still
  // in range and on the visible month.
  setMinDate(date?: Date): void {
    this.minKey = date ? EasyEpoch.dayKey(date) : undefined;
    this.refreshCalendar();
  }

  setMaxDate(date?: Date): void {
    this.maxKey = date ? EasyEpoch.dayKey(date) : undefined;
    this.refreshCalendar();
  }

  private refreshCalendar(): void {
    const cur = this.monthTracker.current;
    if (!cur) return;
    this.render(dateUtil.scrapeMonth(cur, this.monthTracker));
    // render() clears the active class AND the aria-selected / tabindex=0 set
    // by selectDateElement. Re-apply all three when the previous selection is
    // still on the visible month and not disabled, so the roving-tabindex
    // invariant (exactly one tabindex=0 in the grid) holds after the refresh.
    const sel = this.selectedDate;
    if (sel.getFullYear() === cur.getFullYear() && sel.getMonth() === cur.getMonth()) {
      const $td = this.findElementWithDate(sel.getDate().toString());
      if ($td && $td.dataset.disabled === undefined) {
        $td.classList.add('active');
        $td.setAttribute('aria-selected', 'true');
        $td.setAttribute('tabindex', '0');
        this.$activeCell = $td;
      } else {
        this.$activeCell = null;
      }
    } else {
      this.$activeCell = null;
    }
  }

  // Wire two pickers together so this picker's lower bound tracks `other`'s
  // selection. Each time `other` submits, this picker's minDate is updated to
  // the date the user just confirmed and the calendar is re-rendered. The
  // current `other.selectedDate` is applied immediately so links work even
  // when the source picker has already been used.
  linkAfter(other: EasyEpoch): this {
    other.on('submit', () => this.setMinDate(other.selectedDate));
    if (other.selectedDate) this.setMinDate(other.selectedDate);
    return this;
  }

  // Mirror of linkAfter: this picker's upper bound tracks `other`'s selection.
  linkBefore(other: EasyEpoch): this {
    other.on('submit', () => this.setMaxDate(other.selectedDate));
    if (other.selectedDate) this.setMaxDate(other.selectedDate);
    return this;
  }

  // Sugar for the from/to pattern: starts at most == ends, ends at least == starts.
  // Both ends inclusive (same-day ranges are allowed).
  static linkRange(start: EasyEpoch, end: EasyEpoch): void {
    end.linkAfter(start);
    start.linkBefore(end);
  }

  // Allowed CSS custom property name pattern: only alphanumeric, hyphens, and underscores.
  private static readonly CSS_VAR_NAME_RE = /^--[a-zA-Z0-9_-]+$/;
  // Block CSS values that could exfiltrate data via url()/image()/image-set() or
  // execute expressions (legacy IE expression()).
  private static readonly UNSAFE_CSS_VALUE_RE = /url\s*\(|image\s*\(|image-set\s*\(|expression\s*\(/i;
  // Prototype-polluting keys that must never be forwarded.
  private static readonly BANNED_KEYS: ReadonlySet<string> = new Set([
    '__proto__', 'constructor', 'prototype',
  ]);

  setTheme(theme: EasyEpochTheme) {
    const wrapper = this.$easyepochWrapper;

    // Remove existing theme classes
    wrapper.classList.remove('easyepoch-theme-light', 'easyepoch-theme-dark');

    // Clear any inline custom properties from a previous custom theme
    const style = wrapper.style;
    for (let i = style.length - 1; i >= 0; i--) {
      const prop = style[i];
      if (prop.startsWith('--easyepoch-')) {
        style.removeProperty(prop);
      }
    }

    if (theme === 'light') {
      wrapper.classList.add('easyepoch-theme-light');
    } else if (theme === 'dark') {
      wrapper.classList.add('easyepoch-theme-dark');
    } else if (typeof theme === 'object' && theme !== null) {
      for (const key of Object.keys(theme)) {
        // Guard against prototype pollution payloads
        if (EasyEpoch.BANNED_KEYS.has(key)) continue;

        const varName = key.startsWith('--') ? key : '--easyepoch-' + key;

        // Validate the CSS custom property name to prevent injection
        if (!EasyEpoch.CSS_VAR_NAME_RE.test(varName)) continue;

        const value = theme[key];
        if (typeof value !== 'string') continue;

        // Block values that could exfiltrate data or execute expressions
        if (EasyEpoch.UNSAFE_CSS_VALUE_RE.test(value)) continue;

        style.setProperty(varName, value);
      }
    }
  }

  injectTemplate(el: HTMLElement): HTMLElement {
    const importedNode = document.importNode(getTemplateWrapper(), true) as HTMLElement;
    el.appendChild(importedNode);
    return importedNode;
  }

  updateDateComponents(date: Date) {
    const day = this.locale.days[date.getDay()];
    const month = this.locale.months[date.getMonth()];
    const year = date.getFullYear();
    const monthAndYear = month + ' ' + year;

    this.$headerMonthAndYear.textContent = monthAndYear;
    this.$monthAndYear.textContent = monthAndYear;
    this.$day.textContent = day;
    this.$date.textContent = dateUtil.getDisplayDate(date);
  }

  render(data: MonthData) {
    const { $tds, $lastRow } = this;
    const { month, date } = data;
    const renderedYear = date.getFullYear();
    const renderedMonth = date.getMonth();
    const hasRange = this.minKey !== undefined || this.maxKey !== undefined;

    // Drop the previous selection. Every cell carries tabindex="-1" from the
    // template, so only the one that was promoted to tabindex="0" needs
    // resetting - not all 42.
    const prev = this.$activeCell;
    if (prev) {
      prev.classList.remove('active');
      prev.removeAttribute('aria-selected');
      prev.setAttribute('tabindex', '-1');
      this.$activeCell = null;
    }

    let firstDayOffset = -1;
    let daysInMonth = 0;

    // One pass over the 6x7 grid writing each cell's final text + attributes.
    for (let i = 0; i < 42; i++) {
      const td = $tds[i];
      const day = month[(i / 7) | 0][i % 7];

      if (!day) {
        td.textContent = '';
        td.removeAttribute('data-disabled');
        td.setAttribute('data-empty', '');
        // Empty cells stay as gridcells (so the grid keeps its row/col
        // shape for SR navigation) but are marked aria-disabled so AT
        // doesn't announce them as selectable. We deliberately don't set
        // aria-hidden — that would make screen readers skip whole cells
        // when arrowing across the grid, breaking the row structure.
        td.setAttribute('aria-disabled', 'true');
        continue;
      }

      if (firstDayOffset < 0) firstDayOffset = i;
      daysInMonth++;

      td.textContent = '' + day;
      td.removeAttribute('data-empty');
      if (hasRange && this.isDateOutOfRange(renderedYear, renderedMonth, day)) {
        td.setAttribute('data-disabled', '');
        td.setAttribute('aria-disabled', 'true');
      } else {
        td.removeAttribute('data-disabled');
        td.removeAttribute('aria-disabled');
      }
    }

    this.firstDayOffset = firstDayOffset < 0 ? 0 : firstDayOffset;
    this.daysInMonth = daysInMonth;

    // The 6th row (cells 35-41) is only needed when the month spills into
    // it; hide it otherwise to avoid a blank strip of padding.
    $lastRow.style.display = firstDayOffset + daysInMonth > 35 ? 'table-row' : 'none';

    this.updateDateComponents(date);
  }

  updateSelectedDate(el?: HTMLElement) {
    // Day-of-month: from the clicked cell when given, otherwise from the big
    // date display (minus its ordinal suffix).
    const dayText = el
      ? (el.textContent || '').trim()
      : (this.$date.textContent || '').replace(/[a-z]+/, '');
    const dayNum = parseInt(dayText, 10) || 1;

    // Month and year come straight from the tracker (which is what render()
    // drew) rather than being parsed back out of the localized header text.
    const view = this.monthTracker.current || new Date();
    const withTime = !this.timeSectionDisabled;
    const date = withTime
      ? new Date(view.getFullYear(), view.getMonth(), dayNum, this.hours, this.minutes, this.seconds)
      : new Date(view.getFullYear(), view.getMonth(), dayNum);
    this.selectedDate = date;

    let readable = dateUtil.getDisplayDate(date) + ' ' + this.$monthAndYear.textContent;
    if (withTime) readable += ' ' + this.timeText;
    this.readableDate = readable;
  }

  selectDateElement(el: HTMLElement) {
    if (this.$activeCell) {
      this.$activeCell.classList.remove('active');
      this.$activeCell.removeAttribute('aria-selected');
      this.$activeCell.setAttribute('tabindex', '-1');
    }
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');
    // Roving tabindex: only the active cell is in the tab sequence; arrow keys
    // move it from there. This is the standard ARIA grid pattern.
    el.setAttribute('tabindex', '0');
    this.$activeCell = el;

    this.updateSelectedDate(el);
    this.updateDateComponents(this.selectedDate);

    // When the picker is open, follow the active cell with focus so keyboard
    // nav lands on the new cell (and screen readers announce it). Skipped when
    // closed so init/reset doesn't steal focus from the page.
    if (this.$easyepochWrapper.classList.contains('active') &&
        typeof el.focus === 'function') {
      el.focus();
    }
  }

  // Cell for a day-of-month in the rendered month, by index arithmetic. With
  // returnLastIfNotFound, a day past the end of the month yields the last
  // day's cell (used when navigating e.g. from the 31st into a 30-day month).
  findElementWithDate(date: string, returnLastIfNotFound: boolean = false) {
    const { $tds, firstDayOffset, daysInMonth } = this;
    const day = parseInt(date, 10);
    if (day >= 1 && day <= daysInMonth) {
      return $tds[firstDayOffset + day - 1];
    }
    return returnLastIfNotFound && daysInMonth > 0
      ? $tds[firstDayOffset + daysInMonth - 1]
      : undefined;
  }

  handleIconButtonClick(el: HTMLElement) {
    const cls = el.classList;

    if (cls.contains('easyepoch-icon-calender')) {
      // Already on the calendar pane: nothing to switch (and toggling the
      // fade again would wrongly grey out the date header).
      if (cls.contains('active')) return;
      this.$calenderSection.style.display = 'block';
      this.$timeSection.style.display = 'none';
      this.$timeSectionIcon.classList.remove('active');
      cls.add('active');
      this.toggleDisplayFade();
      return;
    }

    if (cls.contains('easyepoch-icon-time')) {
      if (cls.contains('active')) return;
      this.$timeSection.style.display = 'block';
      this.$calenderSection.style.display = 'none';
      this.$calenderIcon.classList.remove('active');
      cls.add('active');
      this.toggleDisplayFade();
      return;
    }

    // Month navigation. Remember the selected day-of-month so it can be
    // re-selected (clamped to the new month's length) after the re-render.
    const active = this.$activeCell;
    const selectedDay = active ? (active.textContent || '').trim() : '';

    if (cls.contains('easyepoch-icon-next')) {
      this.render(dateUtil.scrapeNextMonth(this.monthTracker));
    } else if (cls.contains('easyepoch-icon-previous')) {
      this.render(dateUtil.scrapePreviousMonth(this.monthTracker));
    }

    if (selectedDay) {
      const $dateTd = this.findElementWithDate(selectedDay, true);
      if ($dateTd) this.selectDateElement($dateTd);
    }
  }

  initListeners() {
    const {
      $easyepoch, $timeInput,
      $ok, $cancel, $easyepochWrapper
    } = this;

    $easyepoch.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      e.stopPropagation();
      if (tagName === 'td'
          && target.dataset.empty === undefined
          && target.dataset.disabled === undefined) {
        this.selectDateElement(target);
        return;
      }

      if (tagName === 'button' &&
          target.classList.contains('easyepoch-icon')) {
        this.handleIconButtonClick(target);
        return;
      }
    });

    $timeInput.addEventListener('input', (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      if (value === '') {
        return;
      }

      const [hours, minutes, seconds] = dateUtil.parseTimeInput(value);
      this.setTime(hours, minutes, this.showSeconds ? seconds : 0, false);
      this.updateSelectedDate();
    });

    $ok.addEventListener('click', () => this.submit());
    $cancel.addEventListener('click', () => this.cancelClose());
    $easyepochWrapper.addEventListener('click', () => this.cancelClose());

    document.addEventListener('keydown', this.handleKeydown);
  }

  private submit() {
    this.close();
    this.callEvent('submit', (func) => {
      func(this.selectedDate, this.readableDate);
    });
  }

  private cancelClose() {
    this.close();
    this.callEvent('close', (f) => { f(); });
  }

  // Bound on construction so we have a stable reference (and `this` binding)
  // for both addEventListener and removeEventListener.
  private handleKeydown = (e: KeyboardEvent) => {
    // Only the picker whose overlay is currently active handles keys. Multiple
    // instances on the same page each register this listener; the gate ensures
    // a keystroke only routes to the visible picker.
    if (!this.$easyepochWrapper.classList.contains('active')) return;

    // Tab is trapped so the modal can't be tabbed out of. We handle this BEFORE
    // the time-input bailout so the trap applies even with the input focused.
    if (e.key === 'Tab') {
      this.trapTab(e);
      return;
    }

    // Don't hijack arrows / Enter while the user is editing the time input.
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === 'INPUT') return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.cancelClose();
        return;
      case 'Enter':
        e.preventDefault();
        this.submit();
        return;
      case 'ArrowLeft':
        e.preventDefault();
        this.shiftSelectedDateBy(-1);
        return;
      case 'ArrowRight':
        e.preventDefault();
        this.shiftSelectedDateBy(1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        this.shiftSelectedDateBy(-7);
        return;
      case 'ArrowDown':
        e.preventDefault();
        this.shiftSelectedDateBy(7);
        return;
      case 'PageUp':
        e.preventDefault();
        this.shiftSelectedDateBy(0, e.shiftKey ? -12 : -1);
        return;
      case 'PageDown':
        e.preventDefault();
        this.shiftSelectedDateBy(0, e.shiftKey ? 12 : 1);
        return;
      case 'Home':
        e.preventDefault();
        this.moveSelectionToDayOfMonth(1);
        return;
      case 'End':
        e.preventDefault();
        this.moveSelectionToDayOfMonth(0, true); // last day of month
        return;
    }
  };

  // Focus trap for Tab / Shift+Tab. We let the browser advance focus through
  // the dialog's own focusables normally; we only intercept at the boundaries
  // so focus loops back into the modal instead of escaping to the page.
  private trapTab(e: KeyboardEvent) {
    const focusables = this.getFocusableElements();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || !this.$easyepochWrapper.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !this.$easyepochWrapper.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  // Returns visible, enabled focusable elements inside the dialog, in DOM order.
  // The active calendar cell participates via roving tabindex (tabindex="0");
  // the rest of the cells are tabindex="-1" and are excluded here.
  private getFocusableElements(): HTMLElement[] {
    const sel = [
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const all = Array.from(this.$$(sel)) as HTMLElement[];
    return all.filter((el) => !this.isInHiddenPane(el));
  }

  // Walk up to the wrapper and return true if any ancestor has inline
  // display:none. The picker's pane toggling sets inline display so this is a
  // reliable signal in both real browsers and JSDOM (where computed layout is
  // not available, ruling out offsetParent / getComputedStyle approaches).
  private isInHiddenPane(el: HTMLElement): boolean {
    let cur: HTMLElement | null = el;
    while (cur && cur !== this.$easyepochWrapper) {
      if (cur.style && cur.style.display === 'none') return true;
      cur = cur.parentElement;
    }
    return false;
  }

  private shiftSelectedDateBy(days: number, months: number = 0) {
    const d = this.selectedDate;
    let target: Date;
    if (months !== 0 && days === 0) {
      // Pure month nav: clamp day to target month's last day so Jan 31 + 1 month
      // lands on Feb 28/29 rather than overflowing into March.
      const targetMonth = d.getMonth() + months;
      const targetYear = d.getFullYear();
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const day = Math.min(d.getDate(), lastDay);
      target = new Date(
        targetYear, targetMonth, day,
        d.getHours(), d.getMinutes(), d.getSeconds()
      );
    } else {
      target = new Date(
        d.getFullYear(), d.getMonth() + months, d.getDate() + days,
        d.getHours(), d.getMinutes(), d.getSeconds()
      );
    }
    this.moveSelectionTo(target);
  }

  private moveSelectionToDayOfMonth(day: number, lastDayOfMonth: boolean = false) {
    const d = this.selectedDate;
    const target = lastDayOfMonth
      // Day 0 of month+1 = last day of current month.
      ? new Date(d.getFullYear(), d.getMonth() + 1, 0, d.getHours(), d.getMinutes(), d.getSeconds())
      : new Date(d.getFullYear(), d.getMonth(), day, d.getHours(), d.getMinutes(), d.getSeconds());
    this.moveSelectionTo(target);
  }

  private moveSelectionTo(target: Date) {
    if (this.isDateOutOfRange(target.getFullYear(), target.getMonth(), target.getDate())) {
      // Refuse to move into a disabled cell.
      return;
    }

    const cur = this.selectedDate;
    if (
      target.getFullYear() !== cur.getFullYear() ||
      target.getMonth() !== cur.getMonth()
    ) {
      this.render(dateUtil.scrapeMonth(target, this.monthTracker));
    }

    const $el = this.findElementWithDate(target.getDate().toString());
    if (!$el) return;
    if ($el.dataset.disabled !== undefined) return;
    this.selectDateElement($el);
  }

  callEvent(event: EasyEpochEvent, dispatcher: (a: HandlerFunction) => void) {
    const listeners = this._eventHandlers[event] || [];
    listeners.forEach(function (func: HandlerFunction) {
      dispatcher(func);
    });
  }

  open() {
    // Remember what had focus so we can restore it after close. This keeps
    // keyboard / screen-reader users where they were before the modal stole
    // focus. Skip if the active element is the body (no meaningful focus).
    const active = document.activeElement;
    this.previouslyFocused =
      active && active !== document.body && active instanceof HTMLElement
        ? active
        : null;

    this.$easyepochWrapper.classList.add('active');

    // Move focus into the dialog. Prefer the active calendar cell, but only if
    // its pane is currently visible — if the user closed the picker while the
    // time pane was up, the active cell is inside a display:none subtree, and
    // focusing it leaves keyboard users with no visible focus indicator. In
    // that case (or if there's no active cell at all) fall back to the first
    // visible focusable element in the dialog, with OK as a last resort.
    let target: HTMLElement | null;
    if (this.$activeCell && !this.isInHiddenPane(this.$activeCell)) {
      target = this.$activeCell;
    } else {
      target = this.getFocusableElements()[0] || this.$ok;
    }
    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }

  // can be called by user or by click the cancel btn.
  close() {
    this.$easyepochWrapper.classList.remove('active');

    // Restore focus to whatever had it before open(). Wrapped in a guard so a
    // stale reference (the element was removed from the DOM in the interim)
    // doesn't throw.
    const restore = this.previouslyFocused;
    this.previouslyFocused = null;
    if (restore && document.contains(restore) && typeof restore.focus === 'function') {
      restore.focus();
    }
  }

  // Tear the picker down: close it (restoring focus), detach the
  // document-level key handler, remove the overlay from the DOM and drop all
  // event handlers. Call this before discarding an instance in long-lived
  // pages (SPAs, re-created pickers) so listeners and DOM don't accumulate.
  // Safe to call more than once.
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.$easyepochWrapper.classList.contains('active')) {
      this.close();
    }
    document.removeEventListener('keydown', this.handleKeydown);

    const wrapper = this.$easyepochWrapper;
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }

    this._eventHandlers = {};
    this.$activeCell = null;
    this.previouslyFocused = null;
  }

  on(event: EasyEpochEvent, handler: HandlerFunction) {
    const { _validOnListeners, _eventHandlers } = this;
    if (!_validOnListeners.includes(event)) {
      throw new Error('Not a valid event!');
    }

    _eventHandlers[event] = _eventHandlers[event] || [];
    _eventHandlers[event].push(handler);
  }

  toggleDisplayFade() {
    this.$time.classList.toggle('easyepoch-fade');
    this.$displayDateElements.forEach($el => {
      $el.classList.toggle('easyepoch-fade');
    });
  }
}

export = EasyEpoch;

import * as dateUtil from './date-util';
import { MonthTracker } from './date-util';
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
  private monthTracker: MonthTracker;
  private timeSectionDisabled: boolean;
  private showSeconds: boolean;
  private minDate?: Date;
  private maxDate?: Date;
  private locale: ResolvedLocale;
  private previouslyFocused: HTMLElement | null = null;

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
    this.$timeInput = $('.easyepoch-time-section input');
    this.$timeSection = $('.easyepoch-time-section');
    this.$timeSectionIcon = $('.easyepoch-icon-time');
    this.$timeDisplay = $('.easyepoch-time');
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
    this.minDate = opts.minDate ? this.startOfDay(opts.minDate) : undefined;
    this.maxDate = opts.maxDate ? this.startOfDay(opts.maxDate) : undefined;
    // Locale must be set before the first render so updateDateComponents can
    // read this.locale.months / this.locale.days when laying out the header.
    this.locale = this.resolveLocale(opts.locale);
    this.applyLocaleStrings();

    if (this.showSeconds) {
      this.$timeInput.setAttribute('step', '1');
      this.$timeInput.value = '12:00:00';
    }

    const now = new Date();
    this.render(dateUtil.scrapeMonth(now, this.monthTracker));

    this.reset(opts.selectedDate || now);

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

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
    if (!this.minDate && !this.maxDate) return false;
    const ts = new Date(year, month, day).getTime();
    if (this.minDate && ts < this.minDate.getTime()) return true;
    if (this.maxDate && ts > this.maxDate.getTime()) return true;
    return false;
  }

  // Reset by selecting current date.
  reset(newDate?: Date) {
    const date = newDate || new Date();
    this.render(dateUtil.scrapeMonth(date, this.monthTracker));

    // toTimeString() yields "HH:MM:SS GMT…". Take just the clock part.
    // When showSeconds is off we strip the trailing :SS so the <input type="time">
    // value matches its (default) HH:MM precision.
    const timeFull = date.toTimeString().split(' ')[0];
    const time = this.showSeconds ? timeFull : timeFull.replace(/:\d\d$/, '');
    this.$timeInput.value = time;
    this.$time.textContent = dateUtil.formatTimeFromInputElement(time, this.showSeconds);

    const dateString = date.getDate().toString();
    const $dateEl = this.findElementWithDate(dateString);
    if ($dateEl && !$dateEl.classList.contains('active')) {
      this.selectDateElement($dateEl);
      this.updateDateComponents(date);
    }
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
    const calenderIcon = this.$('.easyepoch-icon-calender');
    const timeIcon = this.$('.easyepoch-icon-time');
    const calenderSection = this.$('.easyepoch-calender-section');
    if (calenderIcon) calenderIcon.classList.add('active');
    if (timeIcon) timeIcon.classList.remove('active');
    if (calenderSection) calenderSection.style.display = 'block';
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
    this.minDate = date ? this.startOfDay(date) : undefined;
    this.refreshCalendar();
  }

  setMaxDate(date?: Date): void {
    this.maxDate = date ? this.startOfDay(date) : undefined;
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
    // Use DOMParser instead of innerHTML to avoid XSS concerns (CodeQL js/xss-through-dom).
    // The template is a compile-time constant, but using DOMParser makes that guarantee
    // enforceable by static analysis and prevents future regressions.
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlTemplate, 'text/html');
    const wrapper = doc.querySelector('.easyepoch-wrapper') as HTMLElement;
    const importedNode = document.importNode(wrapper, true);
    el.appendChild(importedNode);
    return importedNode;
  }

  clearRows() {
    this.$tds.forEach((td) => {
      td.textContent = '';
      td.classList.remove('active');
      td.removeAttribute('aria-selected');
      td.removeAttribute('aria-disabled');
      td.setAttribute('tabindex', '-1');
    });
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

  render(data: { month: unknown[][]; date: Date }) {
    const { $trs, $lastRow } = this;
    const { month, date } = data;
    const renderedYear = date.getFullYear();
    const renderedMonth = date.getMonth();

    this.clearRows();
    month.forEach((week, index) => {
      const $tds = $trs[index].children;
      week.forEach((day, index) => {
        const td = $tds[index];
        td.removeAttribute('data-disabled');
        if (!day) {
          td.setAttribute('data-empty', '');
          // Empty cells stay as gridcells (so the grid keeps its row/col
          // shape for SR navigation) but are marked aria-disabled so AT
          // doesn't announce them as selectable. We deliberately don't set
          // aria-hidden — that would make screen readers skip whole cells
          // when arrowing across the grid, breaking the row structure.
          td.setAttribute('aria-disabled', 'true');
          return;
        }

        td.removeAttribute('data-empty');
        td.textContent = day as string;

        if (this.isDateOutOfRange(renderedYear, renderedMonth, day as number)) {
          td.setAttribute('data-disabled', '');
          td.setAttribute('aria-disabled', 'true');
        }
      });
    });

    // hide last row if it's empty to avoid extra spacing
    const lastRowCells = $lastRow.children;
    let lastRowIsEmpty = true;
    for (let i = 0; i < lastRowCells.length; i++) {
      if (!(lastRowCells[i] as HTMLElement).hasAttribute('data-empty')) {
        lastRowIsEmpty = false;
        break;
      }
    }

    $lastRow.style.display = lastRowIsEmpty ? 'none' : 'table-row';

    this.updateDateComponents(date);
  }

  updateSelectedDate(el?: HTMLElement) {
    const { $monthAndYear, $time, $date } = this;

    let day: string;
    if (el) {
      day = (el.textContent || '').trim();
    } else {
      day = ($date.textContent || '').replace(/[a-z]+/, '');
    }

    const monthAndYearText = ($monthAndYear.textContent || '').trim();
    // The header text is "<localized month> <year>". We rsplit on the last
    // space so multi-word month names (very rare, but cheap to support) survive.
    const lastSpace = monthAndYearText.lastIndexOf(' ');
    const monthName = lastSpace >= 0 ? monthAndYearText.slice(0, lastSpace) : monthAndYearText;
    const year = lastSpace >= 0 ? monthAndYearText.slice(lastSpace + 1) : '0';
    const month = this.locale.months.indexOf(monthName);

    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    const timeText = ($time.textContent || '').trim();

    if (!this.timeSectionDisabled) {
      const timeComponents = timeText.split(':');
      hours = parseInt(timeComponents[0], 10) || 0;
      const minutePart = timeComponents[1] || '';
      // With seconds: "MM" then "SS AM/PM"; without seconds: "MM AM/PM".
      if (this.showSeconds && timeComponents.length >= 3) {
        minutes = parseInt(minutePart, 10) || 0;
        const secPart = (timeComponents[2] || '').split(' ');
        seconds = parseInt(secPart[0], 10) || 0;
        const meridium = secPart[1] || '';
        if (meridium === 'AM' && hours === 12) hours = 0;
        if (meridium === 'PM' && hours < 12) hours += 12;
      } else {
        const minSplit = minutePart.split(' ');
        minutes = parseInt(minSplit[0], 10) || 0;
        const meridium = minSplit[1] || '';
        if (meridium === 'AM' && hours === 12) hours = 0;
        if (meridium === 'PM' && hours < 12) hours += 12;
      }
    }

    const dayNum = parseInt(day, 10) || 1;
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    const date = new Date(yearNum, month >= 0 ? month : 0, dayNum, hours, minutes, seconds);
    this.selectedDate = date;

    let _date = day + ' ' + monthAndYearText;
    if (!this.timeSectionDisabled) {
      _date += ' ' + timeText;
    }
    this.readableDate = _date.replace(/^\d+/, dateUtil.getDisplayDate(date));
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

  findElementWithDate(date: string, returnLastIfNotFound: boolean = false) {
    const { $tds } = this;

    let lastTd;
    for (let i = 0; i < $tds.length; i++) {
      const td = $tds[i];
      const content = td.textContent!.trim();
      if (content === date) {
        return td;
      }
      if (content !== '') {
        lastTd = td;
      }
    }

    return returnLastIfNotFound ? lastTd : undefined;
  }

  handleIconButtonClick(el: HTMLElement) {
    const { $ } = this;
    const baseClass = 'easyepoch-icon-';
    const nextIcon = baseClass + 'next';
    const previousIcon = baseClass + 'previous';
    const calenderIcon = baseClass + 'calender';
    const timeIcon = baseClass + 'time';

    if (el.classList.contains(calenderIcon)) {
      const $timeIcon = $('.' + timeIcon);
      const $timeSection = $('.easyepoch-time-section');
      const $calenderSection = $('.easyepoch-calender-section');

      $calenderSection.style.display = 'block';
      $timeSection.style.display = 'none';
      $timeIcon.classList.remove('active');
      el.classList.add('active');
      this.toggleDisplayFade();
      return;
    }

    if (el.classList.contains(timeIcon)) {
      const $calenderIcon = $('.' + calenderIcon);
      const $calenderSection = $('.easyepoch-calender-section');
      const $timeSection = $('.easyepoch-time-section');

      $timeSection.style.display = 'block';
      $calenderSection.style.display = 'none';
      $calenderIcon.classList.remove('active');
      el.classList.add('active');
      this.toggleDisplayFade();
      return;
    }

    let selectedDate;
    const $active = $('.easyepoch-calender td.active');
    if ($active) {
      selectedDate = $active.textContent!.trim();
    }

    if (el.classList.contains(nextIcon)) {
      this.render(dateUtil.scrapeNextMonth(this.monthTracker));
    }

    if (el.classList.contains(previousIcon)) {
      this.render(dateUtil.scrapePreviousMonth(this.monthTracker));
    }

    if (selectedDate) {
      const $dateTd = this.findElementWithDate(selectedDate, true);
      this.selectDateElement($dateTd);
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

      const formattedTime = dateUtil.formatTimeFromInputElement(value, this.showSeconds);
      this.$time.textContent = formattedTime;
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

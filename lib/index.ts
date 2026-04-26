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
  // Tooltip titles for the icon/action buttons
  selectDateTitle?: string;
  selectTimeTitle?: string;
  okTitle?: string;
  cancelTitle?: string;
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
  selectDateTitle: 'Select date from calender!',
  selectTimeTitle: 'Select time',
  okTitle: 'OK',
  cancelTitle: 'Cancel',
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
    const merged: ResolvedLocale = { ...defaultLocale, ...(input || {}) };
    // If a label is overridden but its tooltip is not, mirror the label so the
    // tooltip stays in the user's language rather than reverting to English.
    if (input && input.ok !== undefined && input.okTitle === undefined) {
      merged.okTitle = input.ok;
    }
    if (input && input.cancel !== undefined && input.cancelTitle === undefined) {
      merged.cancelTitle = input.cancel;
    }
    return merged;
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

    // Calendar/time toggle button tooltips.
    const calenderIcon = this.$('.easyepoch-icon-calender');
    if (calenderIcon) calenderIcon.setAttribute('title', locale.selectDateTitle);
    const timeIcon = this.$('.easyepoch-icon-time');
    if (timeIcon) timeIcon.setAttribute('title', locale.selectTimeTitle);
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
          return;
        }

        td.removeAttribute('data-empty');
        td.textContent = day as string;

        if (this.isDateOutOfRange(renderedYear, renderedMonth, day as number)) {
          td.setAttribute('data-disabled', '');
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
    }
    el.classList.add('active');
    this.$activeCell = el;

    this.updateSelectedDate(el);
    this.updateDateComponents(this.selectedDate);
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
    this.$easyepochWrapper.classList.add('active');
  }

  // can be called by user or by click the cancel btn.
  close() {
    this.$easyepochWrapper.classList.remove('active');
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

import * as dateUtil from './date-util';
import { MonthTracker } from './date-util';
import { htmlTemplate } from './template';

type EasyEpochEvent = 'submit' | 'close';
interface EasyEpochOpts {
  zIndex?: number;
  compactMode?: boolean;
  disableTimeSection?: boolean;
  selectedDate?: Date;
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
  private $: Function;
  private $$: Function;
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
  private monthTracker: MonthTracker;

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
    this.injectTemplate(el);
    this.init(el, opts);
    this.initListeners();

    this._eventHandlers = {};
  }

  // We use $, $$ as helper method to conviently select
  // element we need for easyepoch.
  // Also, Limit the query to the wrapper class to avoid
  // selecting elements on the other instance.
  initElMethod(el) {
    this.$ = (sel) => el.querySelector(sel);
    this.$$ = (sel) => el.querySelectorAll(sel);
  }

  init(el: HTMLElement, opts: EasyEpochOpts) {
    this.$easyepochWrapper = <HTMLElement> el.querySelector('.easyepoch-wrapper');
    this.initElMethod(this.$easyepochWrapper);

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
    this.$timeSectionIcon = $('.easyepoch-icon-time');
    this.$cancel = $('.easyepoch-cancel-btn');
    this.$ok = $('.easyepoch-ok-btn');

    this.$displayDateElements = [
      this.$day,
      this.$headerMonthAndYear,
      this.$date
    ];

    this.$activeCell = null;

    this.$time.classList.add('easyepoch-fade');
    const now = new Date();
    this.render(dateUtil.scrapeMonth(now, this.monthTracker));

    opts = opts || {};
    this.opts = opts;

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
  }

  // Reset by selecting current date.
  reset(newDate?: Date) {
    let date = newDate || new Date();
    this.render(dateUtil.scrapeMonth(date, this.monthTracker));

    // The timeFull variable below will be formatted as HH:mm:ss.
    // Using regular experssion we remove the :ss parts.
    const timeFull = date.toTimeString().split(" ")[0]
    const time = timeFull.replace(/\:\d\d$/, "");
    this.$timeInput.value = time;
    this.$time.textContent = dateUtil.formatTimeFromInputElement(time);

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
    const { $timeSectionIcon } = this;
    $timeSectionIcon.style.visibility = 'hidden';
  }

  enableTimeSection() {
    const { $timeSectionIcon } = this;
    $timeSectionIcon.style.visibility = 'visible';
  }

  injectTemplate(el: HTMLElement) {
    const $template = document.createElement('template');
    $template.innerHTML = htmlTemplate;
    el.appendChild($template.content.cloneNode(true));
  }

  clearRows() {
    this.$tds.forEach((td) => {
      td.textContent = '';
      td.classList.remove('active');
    });
  }

  updateDateComponents(date: Date) {
    const day = dateUtil.days[date.getDay()];
    const month = dateUtil.months[date.getMonth()];
    const year = date.getFullYear();
    const monthAndYear = month + ' ' + year;

    this.$headerMonthAndYear.textContent = monthAndYear;
    this.$monthAndYear.textContent = monthAndYear;
    this.$day.textContent = day;
    this.$date.textContent = dateUtil.getDisplayDate(date);
  }

  render(data) {
    const { $trs, $lastRow } = this;
    const { month, date } = data;

    this.clearRows();
    month.forEach((week, index) => {
      const $tds = $trs[index].children;
      week.forEach((day, index) => {
        const td = $tds[index];
        if (!day) {
          td.setAttribute('data-empty', '');
          return;
        }

        td.removeAttribute('data-empty');
        td.textContent = day;
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

    let day;
    if (el) {
      day = el.textContent!.trim();
    } else {
      day = $date.textContent!.replace(/[a-z]+/, '');
    }

    const monthAndYearText = $monthAndYear.textContent!;
    const [ monthName, year ] = monthAndYearText.split(' ');
    const month = dateUtil.months.indexOf(monthName);
    const timeText = $time.textContent!;
    let timeComponents = timeText.split(':');
    let hours = +timeComponents[0];
    let [ minutes, meridium ] = timeComponents[1].split(' ');

    if (meridium === 'AM' && hours == 12) {
      hours = 0;
    }

    if (meridium === 'PM' && hours < 12) {
      hours += 12;
    }

    const date = new Date(+year, +month, +day, +hours, +minutes);
    this.selectedDate = date;

    let _date = day + ' ';
    _date += monthAndYearText.trim() + ' ';
    _date += timeText.trim();
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

  findElementWithDate(date, returnLastIfNotFound: boolean = false) {
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
      let $dateTd = this.findElementWithDate(selectedDate, true);
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
      if (tagName === 'td' && target.dataset.empty === undefined) {
        this.selectDateElement(target);
        return;
      }

      if (tagName === 'button' &&
          target.classList.contains('easyepoch-icon')) {
        this.handleIconButtonClick(target);
        return;
      }
    });

    $timeInput.addEventListener('input', (e: any) => {
      if (e.target.value === '') {
        return;
      }

      const formattedTime = dateUtil.formatTimeFromInputElement(e.target.value);
      this.$time.textContent = formattedTime;
      this.updateSelectedDate();
    });

    $ok.addEventListener('click', () => {
      this.close();
      this.callEvent('submit', (func) => {
        func(this.selectedDate, this.readableDate);
      });
    });

    const close = () => {
      this.close();
      this.callEvent('close', (f) => { f() });
    };

    $cancel.addEventListener('click', close);
    $easyepochWrapper.addEventListener('click', close);
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

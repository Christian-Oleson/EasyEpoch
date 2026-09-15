// A month laid out as 6 rows x 7 columns (Sunday..Saturday); empty cells are
// undefined.
export type MonthGrid = (number | undefined)[][];

export interface MonthData {
  date: Date;
  month: MonthGrid;
}

export interface MonthTracker {
  years: Record<number, Record<number, MonthGrid>>;
  current?: Date;
}

export const monthTracker: MonthTracker = {
  years: {}
};

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

function emptyRow(length: number): undefined[] {
  return new Array(length);
}

// builds the calender for one month given a date
// which is end, start or in middle of the month
export function createMonthTracker(): MonthTracker {
  return { years: {} };
}

export function scrapeMonth(date: Date, tracker: MonthTracker = monthTracker): MonthData {
  const originalDate = new Date(date.getTime());
  const year = date.getFullYear();
  const month = date.getMonth();

  tracker.current = new Date(date.getTime());
  tracker.current.setDate(1);

  const yearCache = tracker.years[year] || (tracker.years[year] = {});
  const cached = yearCache[month];
  if (cached !== undefined) {
    return { date: originalDate, month: cached };
  }

  date = new Date(date.getTime());
  date.setDate(1);
  const monthData: MonthGrid = [];
  yearCache[month] = monthData;

  let rowTracker = 0;
  while (date.getMonth() === month) {
    const _date = date.getDate();
    const day = date.getDay();
    if (_date === 1) {
      monthData[rowTracker] = emptyRow(day);
    }

    monthData[rowTracker] = monthData[rowTracker] || [];
    monthData[rowTracker][day] = _date;

    if (day === 6) {
      rowTracker++;
    }

    date.setDate(date.getDate() + 1);
  }

  let lastRow = 5;
  if (monthData[5] === undefined) {
    lastRow = 4;
    monthData[5] = emptyRow(7);
  }
  if (monthData[4] === undefined) {
    lastRow = 3;
    monthData[4] = emptyRow(7);
  }

  const lastRowLength = monthData[lastRow].length;
  if (lastRowLength < 7) {
    const filled = monthData[lastRow].concat(emptyRow(7 - lastRowLength));
    monthData[lastRow] = filled;
  }

  return { date: originalDate, month: monthData };
}

export function scrapePreviousMonth(tracker: MonthTracker = monthTracker) {
  const date = tracker.current;
  if (!date) {
    throw Error('scrapePreviousMonth called without setting monthTracker.current!');
  }

  date.setMonth(date.getMonth() - 1);
  return scrapeMonth(date, tracker);
}

export function scrapeNextMonth(tracker: MonthTracker = monthTracker) {
  const date = tracker.current;
  if (!date) {
    throw Error('scrapeNextMonth called without setting monthTracker.current!');
  }

  date.setMonth(date.getMonth() + 1);
  return scrapeMonth(date, tracker);
}

export function getDisplayDate(_date: Date) {
  const date = _date.getDate();
  const mod10 = date % 10;

  if (date > 10 && date < 14) {
    return date + 'th';
  }

  if (mod10 === 1) return date + 'st';
  if (mod10 === 2) return date + 'nd';
  if (mod10 === 3) return date + 'rd';

  return date + 'th';
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

// Parse an <input type="time"> value ("HH:MM" or "HH:MM:SS") into 24h
// components. Missing or out-of-range parts collapse to 0 so the result can
// always be fed straight into a Date constructor.
export function parseTimeInput(input: string): [number, number, number] {
  const parts = input.split(':');
  const clamp = (raw: string | undefined, max: number) => {
    const n = parseInt(raw || '', 10);
    return isNaN(n) || n < 0 || n > max ? 0 : n;
  };
  return [clamp(parts[0], 23), clamp(parts[1], 59), clamp(parts[2], 59)];
}

// 24h components -> the value string an <input type="time"> expects.
export function formatTimeInputValue(hours: number, minutes: number, seconds: number, showSeconds: boolean = false) {
  return pad(hours) + ':' + pad(minutes) + (showSeconds ? ':' + pad(seconds) : '');
}

// 24h components -> the 12-hour "HH:MM[:SS] AM/PM" display string.
export function formatTime(hours: number, minutes: number, seconds: number, showSeconds: boolean = false) {
  const isPM = hours >= 12;
  const hour12 = hours % 12 || 12;
  let timeString = pad(hour12) + ':' + pad(minutes);
  if (showSeconds) timeString += ':' + pad(seconds);
  return timeString + ' ' + (isPM ? 'PM' : 'AM');
}

export function formatTimeFromInputElement(input: string, showSeconds: boolean = false) {
  if (input.split(':').length < 2) return showSeconds ? '12:00:00 PM' : '12:00 PM';
  const [hours, minutes, seconds] = parseTimeInput(input);
  return formatTime(hours, minutes, showSeconds ? seconds : 0, showSeconds);
}

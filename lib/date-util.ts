export interface MonthTracker {
  years: Object;
  current?: Date;
};

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

export function scrapeMonth(date: Date, tracker: MonthTracker = monthTracker) {
  const originalDate = new Date(date.getTime());
  const year = date.getFullYear();
  const month = date.getMonth();

  const data = {
    date: originalDate,
    month: undefined
  };

  tracker.current = new Date(date.getTime());
  tracker.current.setDate(1);
  tracker.years[year] = tracker.years[year] || {};
  if (tracker.years[year][month] !== undefined) {
    data.month = tracker.years[year][month];
    return data;
  }

  date = new Date(date.getTime());
  date.setDate(1);
  tracker.years[year][month] = [];

  let monthData = tracker.years[year][month];
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

  let lastRowLength = monthData[lastRow].length;
  if (lastRowLength < 7) {
    let filled = monthData[lastRow].concat(emptyRow(7 - lastRowLength));
    monthData[lastRow] = filled;
  }

  data.month = monthData;
  return data;
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

export function formatTimeFromInputElement(input: string) {
  let timeString = '';
  type StringOrNumberTuple = [string | number, string | number];
  let [ hour, minute ] = input.split(':') as StringOrNumberTuple;
  hour = +hour;

  const isPM = hour >= 12;
  if (isPM && hour > 12) {
    hour = hour - 12;
  }

  if (!isPM && hour === 0) {
    hour = 12;
  }

  timeString += hour < 10 ? '0' + hour : hour;
  timeString += ':' + minute + ' ';
  timeString += isPM ? 'PM' : 'AM';
  return timeString;
}

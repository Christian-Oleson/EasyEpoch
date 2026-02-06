import {
  months,
  days,
  scrapeMonth,
  scrapePreviousMonth,
  scrapeNextMonth,
  getDisplayDate,
  formatTimeFromInputElement,
  monthTracker,
} from '../lib/date-util';

beforeEach(() => {
  // Reset monthTracker state between tests to avoid cross-test pollution
  monthTracker.years = {};
  monthTracker.current = undefined;
});

describe('months array', () => {
  it('should have 12 months', () => {
    expect(months).toHaveLength(12);
  });

  it('should start with January and end with December', () => {
    expect(months[0]).toBe('January');
    expect(months[11]).toBe('December');
  });

  it('should contain all months in order', () => {
    const expected = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    expect(months).toEqual(expected);
  });
});

describe('days array', () => {
  it('should have 7 days', () => {
    expect(days).toHaveLength(7);
  });

  it('should start with Sunday and end with Saturday', () => {
    expect(days[0]).toBe('Sunday');
    expect(days[6]).toBe('Saturday');
  });

  it('should contain all days in order', () => {
    const expected = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday'
    ];
    expect(days).toEqual(expected);
  });
});

describe('getDisplayDate', () => {
  it('should return "1st" for the 1st', () => {
    const date = new Date(2024, 0, 1);
    expect(getDisplayDate(date)).toBe('1st');
  });

  it('should return "2nd" for the 2nd', () => {
    const date = new Date(2024, 0, 2);
    expect(getDisplayDate(date)).toBe('2nd');
  });

  it('should return "3rd" for the 3rd', () => {
    const date = new Date(2024, 0, 3);
    expect(getDisplayDate(date)).toBe('3rd');
  });

  it('should return "4th" for the 4th', () => {
    const date = new Date(2024, 0, 4);
    expect(getDisplayDate(date)).toBe('4th');
  });

  it('should return "th" for dates 4-20 (except teens)', () => {
    for (let d = 4; d <= 20; d++) {
      const date = new Date(2024, 0, d);
      expect(getDisplayDate(date)).toBe(d + 'th');
    }
  });

  it('should return "21st" for the 21st', () => {
    const date = new Date(2024, 0, 21);
    expect(getDisplayDate(date)).toBe('21st');
  });

  it('should return "22nd" for the 22nd', () => {
    const date = new Date(2024, 0, 22);
    expect(getDisplayDate(date)).toBe('22nd');
  });

  it('should return "23rd" for the 23rd', () => {
    const date = new Date(2024, 0, 23);
    expect(getDisplayDate(date)).toBe('23rd');
  });

  it('should return "31st" for the 31st', () => {
    const date = new Date(2024, 0, 31);
    expect(getDisplayDate(date)).toBe('31st');
  });

  it('should return "th" for 11th, 12th, 13th', () => {
    expect(getDisplayDate(new Date(2024, 0, 11))).toBe('11th');
    expect(getDisplayDate(new Date(2024, 0, 12))).toBe('12th');
    expect(getDisplayDate(new Date(2024, 0, 13))).toBe('13th');
  });

  it('should return "th" for dates like 24th-30th', () => {
    for (let d = 24; d <= 30; d++) {
      const date = new Date(2024, 0, d);
      expect(getDisplayDate(date)).toBe(d + 'th');
    }
  });
});

describe('formatTimeFromInputElement', () => {
  it('should format midnight (00:00) as 12:00 AM', () => {
    expect(formatTimeFromInputElement('00:00')).toBe('12:00 AM');
  });

  it('should format 01:30 as 01:30 AM', () => {
    expect(formatTimeFromInputElement('01:30')).toBe('01:30 AM');
  });

  it('should format 11:59 as 11:59 AM', () => {
    expect(formatTimeFromInputElement('11:59')).toBe('11:59 AM');
  });

  it('should format noon (12:00) as 12:00 PM', () => {
    expect(formatTimeFromInputElement('12:00')).toBe('12:00 PM');
  });

  it('should format 13:00 as 01:00 PM', () => {
    expect(formatTimeFromInputElement('13:00')).toBe('01:00 PM');
  });

  it('should format 23:59 as 11:59 PM', () => {
    expect(formatTimeFromInputElement('23:59')).toBe('11:59 PM');
  });

  it('should format single-digit hours with leading zero', () => {
    expect(formatTimeFromInputElement('09:05')).toBe('09:05 AM');
  });

  it('should format 15:45 as 03:45 PM', () => {
    expect(formatTimeFromInputElement('15:45')).toBe('03:45 PM');
  });

  it('should format 12:30 as 12:30 PM (not 00:30 PM)', () => {
    expect(formatTimeFromInputElement('12:30')).toBe('12:30 PM');
  });
});

describe('scrapeMonth', () => {
  it('should return an object with date and month properties', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = scrapeMonth(date);
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('month');
  });

  it('should preserve the original date passed in', () => {
    const date = new Date(2024, 0, 15);
    const result = scrapeMonth(date);
    expect(result.date.getDate()).toBe(15);
    expect(result.date.getMonth()).toBe(0);
    expect(result.date.getFullYear()).toBe(2024);
  });

  it('should produce a 2D array with up to 6 rows', () => {
    const date = new Date(2024, 0, 1); // January 2024
    const result = scrapeMonth(date);
    expect(result.month).toHaveLength(6);
  });

  it('should correctly place Jan 1, 2024 on Monday (index 1)', () => {
    // Jan 1, 2024 is a Monday
    const result = scrapeMonth(new Date(2024, 0, 1));
    expect(result.month[0][1]).toBe(1);
    // Sunday (index 0) should be undefined
    expect(result.month[0][0]).toBeUndefined();
  });

  it('should have 31 days for January', () => {
    const result = scrapeMonth(new Date(2024, 0, 1));
    const allDays: number[] = [];
    result.month.forEach((week: any[]) => {
      week.forEach((day: number | undefined) => {
        if (day !== undefined) {
          allDays.push(day);
        }
      });
    });
    expect(allDays).toHaveLength(31);
    expect(Math.max(...allDays)).toBe(31);
    expect(Math.min(...allDays)).toBe(1);
  });

  it('should have 28 days for February in non-leap year (2023)', () => {
    const result = scrapeMonth(new Date(2023, 1, 1));
    const allDays: number[] = [];
    result.month.forEach((week: any[]) => {
      week.forEach((day: number | undefined) => {
        if (day !== undefined) {
          allDays.push(day);
        }
      });
    });
    expect(allDays).toHaveLength(28);
  });

  it('should have 29 days for February in leap year (2024)', () => {
    const result = scrapeMonth(new Date(2024, 1, 1));
    const allDays: number[] = [];
    result.month.forEach((week: any[]) => {
      week.forEach((day: number | undefined) => {
        if (day !== undefined) {
          allDays.push(day);
        }
      });
    });
    expect(allDays).toHaveLength(29);
  });

  it('should set monthTracker.current to the 1st of the month', () => {
    scrapeMonth(new Date(2024, 5, 15)); // June 15
    expect(monthTracker.current!.getDate()).toBe(1);
    expect(monthTracker.current!.getMonth()).toBe(5);
  });

  it('should cache the result in monthTracker.years', () => {
    scrapeMonth(new Date(2024, 0, 1));
    expect(monthTracker.years[2024]).toBeDefined();
    expect(monthTracker.years[2024][0]).toBeDefined();
  });

  it('should return cached result on second call for same month', () => {
    const result1 = scrapeMonth(new Date(2024, 0, 1));
    const result2 = scrapeMonth(new Date(2024, 0, 15));
    // Same month array reference due to caching
    expect(result1.month).toBe(result2.month);
  });

  it('should handle months that start on Sunday', () => {
    // September 2024 starts on Sunday
    const result = scrapeMonth(new Date(2024, 8, 1));
    expect(result.month[0][0]).toBe(1);
  });

  it('should handle months that start on Saturday', () => {
    // June 2024 starts on Saturday
    const result = scrapeMonth(new Date(2024, 5, 1));
    expect(result.month[0][6]).toBe(1);
    // All other days in first week should be undefined
    for (let i = 0; i < 6; i++) {
      expect(result.month[0][i]).toBeUndefined();
    }
  });

  it('should have each row be length 7', () => {
    const result = scrapeMonth(new Date(2024, 0, 1));
    result.month.forEach((week: any[]) => {
      expect(week).toHaveLength(7);
    });
  });

  it('BUG: crashes for months needing only 4 rows (e.g., Feb 2026 starts Sunday)', () => {
    // February 2026 starts on Sunday and has 28 days = exactly 4 weeks.
    // The function assumes at least 5 rows exist, causing tracker[4] to be
    // undefined at the lastRowLength check, which throws a TypeError.
    expect(() => scrapeMonth(new Date(2026, 1, 1))).toThrow();
  });
});

describe('scrapePreviousMonth', () => {
  it('should throw if monthTracker.current is not set', () => {
    monthTracker.current = undefined;
    expect(() => scrapePreviousMonth()).toThrow();
  });

  it('should navigate from February to January', () => {
    scrapeMonth(new Date(2024, 1, 15)); // February
    const result = scrapePreviousMonth();
    expect(result.date.getMonth()).toBe(0); // January
  });

  it('should navigate from January to December of previous year', () => {
    scrapeMonth(new Date(2024, 0, 15)); // January 2024
    const result = scrapePreviousMonth();
    expect(result.date.getMonth()).toBe(11); // December
    expect(result.date.getFullYear()).toBe(2023);
  });
});

describe('scrapeNextMonth', () => {
  it('should throw if monthTracker.current is not set', () => {
    monthTracker.current = undefined;
    expect(() => scrapeNextMonth()).toThrow();
  });

  it('should navigate from January to February', () => {
    scrapeMonth(new Date(2024, 0, 15)); // January
    const result = scrapeNextMonth();
    expect(result.date.getMonth()).toBe(1); // February
  });

  it('should navigate from December to January of next year', () => {
    scrapeMonth(new Date(2024, 11, 15)); // December 2024
    const result = scrapeNextMonth();
    expect(result.date.getMonth()).toBe(0); // January
    expect(result.date.getFullYear()).toBe(2025);
  });

  it('should navigate multiple months in sequence', () => {
    scrapeMonth(new Date(2024, 0, 1)); // January
    scrapeNextMonth(); // February
    scrapeNextMonth(); // March
    const result = scrapeNextMonth(); // April
    expect(result.date.getMonth()).toBe(3);
  });
});

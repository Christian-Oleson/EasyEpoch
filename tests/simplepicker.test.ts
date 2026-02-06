import SimplePicker from '../lib/index';
import { monthTracker, scrapeMonth, scrapeNextMonth } from '../lib/date-util';

beforeEach(() => {
  // Clean up any previous picker DOM
  document.body.innerHTML = '';
  // Reset monthTracker between tests
  monthTracker.years = {};
  monthTracker.current = undefined;
});

describe('SimplePicker constructor', () => {
  it('should create a picker on document.body when no args given', () => {
    const picker = new SimplePicker();
    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should create a picker on a CSS selector target', () => {
    const div = document.createElement('div');
    div.id = 'target';
    document.body.appendChild(div);

    const picker = new SimplePicker('#target');
    const wrapper = div.querySelector('.simplepicker-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should create a picker on an HTMLElement target', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const picker = new SimplePicker(div);
    const wrapper = div.querySelector('.simplepicker-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should accept options as first argument', () => {
    const picker = new SimplePicker({ zIndex: 999 });
    const wrapper = document.querySelector('.simplepicker-wrapper') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.zIndex).toBe('999');
  });

  it('should accept element and options together', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const picker = new SimplePicker(div, { zIndex: 50 });
    const wrapper = div.querySelector('.simplepicker-wrapper') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.zIndex).toBe('50');
  });

  it('should throw when an invalid selector is passed', () => {
    expect(() => new SimplePicker('#nonexistent')).toThrow('Invalid selector passed to SimplePicker!');
  });

  it('should set selectedDate to today by default', () => {
    const picker = new SimplePicker();
    const now = new Date();
    expect(picker.selectedDate.getFullYear()).toBe(now.getFullYear());
    expect(picker.selectedDate.getMonth()).toBe(now.getMonth());
    expect(picker.selectedDate.getDate()).toBe(now.getDate());
  });

  it('should use selectedDate from options when provided', () => {
    const customDate = new Date(2023, 5, 15);
    const picker = new SimplePicker({ selectedDate: customDate });
    expect(picker.selectedDate.getMonth()).toBe(5);
    expect(picker.selectedDate.getDate()).toBe(15);
  });
});

describe('SimplePicker.open() and close()', () => {
  it('should add active class when opened', () => {
    const picker = new SimplePicker();
    picker.open();
    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(true);
  });

  it('should remove active class when closed', () => {
    const picker = new SimplePicker();
    picker.open();
    picker.close();
    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });

  it('should not have active class before opening', () => {
    const picker = new SimplePicker();
    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });
});

describe('SimplePicker.on()', () => {
  it('should register a submit handler without error', () => {
    const picker = new SimplePicker();
    expect(() => {
      picker.on('submit', () => {});
    }).not.toThrow();
  });

  it('should register a close handler without error', () => {
    const picker = new SimplePicker();
    expect(() => {
      picker.on('close', () => {});
    }).not.toThrow();
  });

  it('should throw on invalid event name', () => {
    const picker = new SimplePicker();
    expect(() => {
      (picker as any).on('invalid', () => {});
    }).toThrow('Not a valid event!');
  });

  it('should call submit handler when OK button is clicked', () => {
    const picker = new SimplePicker();
    const handler = jest.fn();
    picker.on('submit', handler);
    picker.open();

    const okBtn = document.querySelector('.simplepicker-ok-btn') as HTMLElement;
    okBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(String)
    );
  });

  it('should call close handler when Cancel button is clicked', () => {
    const picker = new SimplePicker();
    const handler = jest.fn();
    picker.on('close', handler);
    picker.open();

    const cancelBtn = document.querySelector('.simplepicker-cancel-btn') as HTMLElement;
    cancelBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple handlers for the same event', () => {
    const picker = new SimplePicker();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    picker.on('submit', handler1);
    picker.on('submit', handler2);
    picker.open();

    const okBtn = document.querySelector('.simplepicker-ok-btn') as HTMLElement;
    okBtn.click();

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should close the picker when OK is clicked', () => {
    const picker = new SimplePicker();
    picker.on('submit', () => {});
    picker.open();

    const okBtn = document.querySelector('.simplepicker-ok-btn') as HTMLElement;
    okBtn.click();

    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });

  it('should close the picker when Cancel is clicked', () => {
    const picker = new SimplePicker();
    picker.open();

    const cancelBtn = document.querySelector('.simplepicker-cancel-btn') as HTMLElement;
    cancelBtn.click();

    const wrapper = document.querySelector('.simplepicker-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });
});

describe('SimplePicker.reset()', () => {
  it('should reset to today when called without arguments', () => {
    const picker = new SimplePicker();
    picker.reset();
    const now = new Date();
    expect(picker.selectedDate.getDate()).toBe(now.getDate());
    expect(picker.selectedDate.getMonth()).toBe(now.getMonth());
  });

  it('should reset to a specific date when provided', () => {
    const picker = new SimplePicker();
    const targetDate = new Date(2023, 8, 25); // Sep 25, 2023
    picker.reset(targetDate);
    expect(picker.selectedDate.getMonth()).toBe(8);
    expect(picker.selectedDate.getDate()).toBe(25);
  });

  it('should update the calendar display when reset', () => {
    const picker = new SimplePicker();
    const targetDate = new Date(2024, 5, 15); // June 15, 2024
    picker.reset(targetDate);

    const monthAndYear = document.querySelector('.simplepicker-month-and-year');
    expect(monthAndYear!.innerHTML).toContain('June');
    expect(monthAndYear!.innerHTML).toContain('2024');
  });

  it('should update the time input value when reset', () => {
    const picker = new SimplePicker();
    const targetDate = new Date(2024, 0, 1, 14, 30); // 2:30 PM
    picker.reset(targetDate);

    // The time input element gets the 24h value directly
    const timeInput = document.querySelector('.simplepicker-time-section input') as HTMLInputElement;
    expect(timeInput.value).toBe('14:30');
  });
});

describe('SimplePicker.compactMode()', () => {
  it('should hide the date display when compact mode is enabled', () => {
    const picker = new SimplePicker();
    picker.compactMode();
    const dateEl = document.querySelector('.simplepicker-date') as HTMLElement;
    expect(dateEl.style.display).toBe('none');
  });

  it('should be applied via constructor options', () => {
    const picker = new SimplePicker({ compactMode: true });
    const dateEl = document.querySelector('.simplepicker-date') as HTMLElement;
    expect(dateEl.style.display).toBe('none');
  });
});

describe('SimplePicker.disableTimeSection() / enableTimeSection()', () => {
  it('should hide the time icon when disabled', () => {
    const picker = new SimplePicker();
    picker.disableTimeSection();
    const timeIcon = document.querySelector('.simplepicker-icon-time') as HTMLElement;
    expect(timeIcon.style.visibility).toBe('hidden');
  });

  it('should show the time icon when enabled', () => {
    const picker = new SimplePicker();
    picker.disableTimeSection();
    picker.enableTimeSection();
    const timeIcon = document.querySelector('.simplepicker-icon-time') as HTMLElement;
    expect(timeIcon.style.visibility).toBe('visible');
  });

  it('should be applied via constructor options', () => {
    const picker = new SimplePicker({ disableTimeSection: true });
    const timeIcon = document.querySelector('.simplepicker-icon-time') as HTMLElement;
    expect(timeIcon.style.visibility).toBe('hidden');
  });
});

describe('SimplePicker calendar rendering', () => {
  it('should render calendar cells with day numbers', () => {
    const picker = new SimplePicker();
    const tds = document.querySelectorAll('.simplepicker-calender tbody td');
    const filledCells = Array.from(tds).filter(td => td.innerHTML.trim() !== '');
    // A month has at least 28 days
    expect(filledCells.length).toBeGreaterThanOrEqual(28);
    expect(filledCells.length).toBeLessThanOrEqual(31);
  });

  it('should mark the selected date as active', () => {
    const picker = new SimplePicker();
    const activeTd = document.querySelector('.simplepicker-calender tbody td.active');
    expect(activeTd).not.toBeNull();
  });

  it('should display the correct month and year in the header', () => {
    const picker = new SimplePicker();
    const now = new Date();
    const expectedMonth = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][now.getMonth()];

    const header = document.querySelector('.simplepicker-month-and-year');
    expect(header!.innerHTML).toContain(expectedMonth);
    expect(header!.innerHTML).toContain(now.getFullYear().toString());
  });
});

describe('SimplePicker date selection', () => {
  it('should update selectedDate when a calendar cell is clicked', () => {
    const picker = new SimplePicker();
    const tds = document.querySelectorAll('.simplepicker-calender tbody td');
    // Find a non-empty td that is not active
    let targetTd: HTMLElement | null = null;
    tds.forEach(td => {
      if (td.innerHTML.trim() !== '' && !td.classList.contains('active') && td.getAttribute('data-empty') === null) {
        targetTd = td as HTMLElement;
      }
    });

    if (targetTd) {
      const clickedDay = parseInt((targetTd as HTMLElement).innerHTML.trim());
      (targetTd as HTMLElement).click();
      expect(picker.selectedDate.getDate()).toBe(clickedDay);
    }
  });

  it('should move active class to the clicked cell', () => {
    const picker = new SimplePicker();
    const tds = document.querySelectorAll('.simplepicker-calender tbody td');
    let targetTd: HTMLElement | null = null;
    tds.forEach(td => {
      if (td.innerHTML.trim() !== '' && !td.classList.contains('active') && td.getAttribute('data-empty') === null) {
        targetTd = td as HTMLElement;
      }
    });

    if (targetTd) {
      (targetTd as HTMLElement).click();
      expect((targetTd as HTMLElement).classList.contains('active')).toBe(true);
      // There should only be one active td
      const activeTds = document.querySelectorAll('.simplepicker-calender tbody td.active');
      expect(activeTds).toHaveLength(1);
    }
  });
});

describe('SimplePicker month navigation', () => {
  it('should navigate to next month when next button is clicked', () => {
    const picker = new SimplePicker();
    const now = new Date();
    const expectedNextMonth = (now.getMonth() + 1) % 12;
    const expectedMonthName = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][expectedNextMonth];

    // The next button is inside the simpilepicker-date-picker, we need to click it directly
    const nextBtn = document.querySelector('.simplepicker-icon-next') as HTMLElement;
    nextBtn.click();

    const selectedDate = document.querySelector('.simplepicker-selected-date');
    expect(selectedDate!.innerHTML).toContain(expectedMonthName);
  });

  it('should navigate to previous month when previous button is clicked', () => {
    const picker = new SimplePicker();
    const now = new Date();
    const expectedPrevMonth = (now.getMonth() + 11) % 12;
    const expectedMonthName = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][expectedPrevMonth];

    const prevBtn = document.querySelector('.simplepicker-icon-previous') as HTMLElement;
    prevBtn.click();

    const selectedDate = document.querySelector('.simplepicker-selected-date');
    expect(selectedDate!.innerHTML).toContain(expectedMonthName);
  });
});

describe('SimplePicker zIndex option', () => {
  it('should set z-index on the wrapper when provided', () => {
    const picker = new SimplePicker({ zIndex: 1000 });
    const wrapper = document.querySelector('.simplepicker-wrapper') as HTMLElement;
    expect(wrapper.style.zIndex).toBe('1000');
  });

  it('should not set z-index when not provided', () => {
    const picker = new SimplePicker();
    const wrapper = document.querySelector('.simplepicker-wrapper') as HTMLElement;
    expect(wrapper.style.zIndex).toBe('');
  });
});

describe('SimplePicker multiple instances', () => {
  it('should allow creating multiple pickers on different elements', () => {
    const div1 = document.createElement('div');
    div1.className = 'picker-1';
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.className = 'picker-2';
    document.body.appendChild(div2);

    const picker1 = new SimplePicker('.picker-1');
    const picker2 = new SimplePicker('.picker-2');

    const wrappers = document.querySelectorAll('.simplepicker-wrapper');
    expect(wrappers.length).toBe(2);
  });

  it('should open/close independently', () => {
    const div1 = document.createElement('div');
    div1.className = 'picker-1';
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.className = 'picker-2';
    document.body.appendChild(div2);

    const picker1 = new SimplePicker('.picker-1');
    const picker2 = new SimplePicker('.picker-2');

    picker1.open();
    expect(div1.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(true);
    expect(div2.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(false);

    picker2.open();
    expect(div1.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(true);
    expect(div2.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(true);

    picker1.close();
    expect(div1.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(false);
    expect(div2.querySelector('.simplepicker-wrapper')!.classList.contains('active')).toBe(true);
  });
});

describe('SimplePicker public properties', () => {
  it('should expose selectedDate as a Date object', () => {
    const picker = new SimplePicker();
    expect(picker.selectedDate).toBeInstanceOf(Date);
  });

  it('should expose _eventHandlers object', () => {
    const picker = new SimplePicker();
    expect(typeof picker._eventHandlers).toBe('object');
  });

  it('should expose _validOnListeners', () => {
    const picker = new SimplePicker();
    expect(picker._validOnListeners).toContain('submit');
    expect(picker._validOnListeners).toContain('close');
  });
});

describe('Known bugs', () => {
  describe('Bug: readableDate missing ordinal suffix', () => {
    it('readableDate should ideally contain ordinal suffix but currently does not', () => {
      const picker = new SimplePicker({ selectedDate: new Date(2024, 0, 1, 12, 0) });
      picker.open();

      const okBtn = document.querySelector('.simplepicker-ok-btn') as HTMLElement;
      let capturedReadable = '';
      picker.on('submit', (_date, readable) => {
        capturedReadable = readable as string;
      });
      okBtn.click();

      // This documents the current (buggy) behavior: no ordinal suffix in readableDate
      // The readableDate contains just the number, not "1st"
      // A fixed version would have "1st January 2024 12:00 PM"
      expect(capturedReadable).toMatch(/^\d+ January 2024/);
    });
  });

  describe('Bug: clicking empty calendar cell', () => {
    it('should handle clicks on empty cells without crashing', () => {
      const picker = new SimplePicker();
      const tds = document.querySelectorAll('.simplepicker-calender tbody td');
      // Find an empty td
      let emptyTd: HTMLElement | null = null;
      tds.forEach(td => {
        if (td.innerHTML.trim() === '' || td.getAttribute('data-empty') !== null) {
          emptyTd = td as HTMLElement;
        }
      });

      // Currently this will set invalid data - documenting the bug
      if (emptyTd) {
        // This should not throw, but it sets empty/invalid date data
        expect(() => (emptyTd as HTMLElement).click()).not.toThrow();
      }
    });
  });

  describe('Bug: error message typo in scrapeNextMonth', () => {
    it('scrapeNextMonth error message incorrectly says "scrapePrevoisMonth"', () => {
      monthTracker.current = undefined;
      let errorMessage = '';
      try {
        scrapeNextMonth();
      } catch (e: any) {
        errorMessage = e.message;
      }
      // The error message says "scrapePrevoisMonth" even though this is scrapeNextMonth
      expect(errorMessage).toContain('scrapePrevoisMonth');
    });
  });

  describe('Bug: simpilepicker typo in class name', () => {
    it('inner picker div uses "simpilepicker" instead of "simplepicker"', () => {
      const picker = new SimplePicker();
      // The typo exists - querying by the misspelled class should find the element
      expect(document.querySelector('.simpilepicker-date-picker')).not.toBeNull();
      // The correctly-spelled version should NOT exist
      expect(document.querySelector('.simplepicker-date-picker')).toBeNull();
    });
  });

  describe('Bug: scrapeMonth crashes for months with exactly 4 calendar rows', () => {
    it('should crash for February 2026 (starts Sunday, 28 days = exactly 4 rows)', () => {
      // February 2026 starts on Sunday and has 28 days, fitting perfectly in 4 rows.
      // The scrapeMonth function assumes at least 5 rows and crashes when
      // tracker[4] is undefined at line 94: tracker[lastRow].length
      expect(() => scrapeMonth(new Date(2026, 1, 1))).toThrow();
    });
  });
});

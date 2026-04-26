import { describe, it, expect, beforeEach, vi } from 'vitest';
import EasyEpoch from '../lib/index';
import { monthTracker, scrapeMonth, scrapeNextMonth, scrapePreviousMonth } from '../lib/date-util';

beforeEach(() => {
  // Clean up any previous picker DOM
  document.body.innerHTML = '';
  // Reset monthTracker between tests
  monthTracker.years = {};
  monthTracker.current = undefined;
});

describe('EasyEpoch constructor', () => {
  it('should create a picker on document.body when no args given', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should create a picker on a CSS selector target', () => {
    const div = document.createElement('div');
    div.id = 'target';
    document.body.appendChild(div);

    const picker = new EasyEpoch('#target');
    const wrapper = div.querySelector('.easyepoch-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should create a picker on an HTMLElement target', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const picker = new EasyEpoch(div);
    const wrapper = div.querySelector('.easyepoch-wrapper');
    expect(wrapper).not.toBeNull();
  });

  it('should accept options as first argument', () => {
    const picker = new EasyEpoch({ zIndex: 999 });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.zIndex).toBe('999');
  });

  it('should accept element and options together', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const picker = new EasyEpoch(div, { zIndex: 50 });
    const wrapper = div.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.zIndex).toBe('50');
  });

  it('should throw when an invalid selector is passed', () => {
    expect(() => new EasyEpoch('#nonexistent')).toThrow('Invalid selector passed to EasyEpoch!');
  });

  it('should set selectedDate to today by default', () => {
    const picker = new EasyEpoch();
    const now = new Date();
    expect(picker.selectedDate.getFullYear()).toBe(now.getFullYear());
    expect(picker.selectedDate.getMonth()).toBe(now.getMonth());
    expect(picker.selectedDate.getDate()).toBe(now.getDate());
  });

  it('should use selectedDate from options when provided', () => {
    const customDate = new Date(2023, 5, 15);
    const picker = new EasyEpoch({ selectedDate: customDate });
    expect(picker.selectedDate.getMonth()).toBe(5);
    expect(picker.selectedDate.getDate()).toBe(15);
  });
});

describe('EasyEpoch.open() and close()', () => {
  it('should add active class when opened', () => {
    const picker = new EasyEpoch();
    picker.open();
    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(true);
  });

  it('should remove active class when closed', () => {
    const picker = new EasyEpoch();
    picker.open();
    picker.close();
    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });

  it('should not have active class before opening', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });
});

describe('EasyEpoch.on()', () => {
  it('should register a submit handler without error', () => {
    const picker = new EasyEpoch();
    expect(() => {
      picker.on('submit', () => {});
    }).not.toThrow();
  });

  it('should register a close handler without error', () => {
    const picker = new EasyEpoch();
    expect(() => {
      picker.on('close', () => {});
    }).not.toThrow();
  });

  it('should throw on invalid event name', () => {
    const picker = new EasyEpoch();
    expect(() => {
      (picker as any).on('invalid', () => {});
    }).toThrow('Not a valid event!');
  });

  it('should call submit handler when OK button is clicked', () => {
    const picker = new EasyEpoch();
    const handler = vi.fn();
    picker.on('submit', handler);
    picker.open();

    const okBtn = document.querySelector('.easyepoch-ok-btn') as HTMLElement;
    okBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(String)
    );
  });

  it('should call close handler when Cancel button is clicked', () => {
    const picker = new EasyEpoch();
    const handler = vi.fn();
    picker.on('close', handler);
    picker.open();

    const cancelBtn = document.querySelector('.easyepoch-cancel-btn') as HTMLElement;
    cancelBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple handlers for the same event', () => {
    const picker = new EasyEpoch();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    picker.on('submit', handler1);
    picker.on('submit', handler2);
    picker.open();

    const okBtn = document.querySelector('.easyepoch-ok-btn') as HTMLElement;
    okBtn.click();

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should close the picker when OK is clicked', () => {
    const picker = new EasyEpoch();
    picker.on('submit', () => {});
    picker.open();

    const okBtn = document.querySelector('.easyepoch-ok-btn') as HTMLElement;
    okBtn.click();

    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });

  it('should close the picker when Cancel is clicked', () => {
    const picker = new EasyEpoch();
    picker.open();

    const cancelBtn = document.querySelector('.easyepoch-cancel-btn') as HTMLElement;
    cancelBtn.click();

    const wrapper = document.querySelector('.easyepoch-wrapper');
    expect(wrapper!.classList.contains('active')).toBe(false);
  });
});

describe('EasyEpoch.reset()', () => {
  it('should reset to today when called without arguments', () => {
    const picker = new EasyEpoch();
    picker.reset();
    const now = new Date();
    expect(picker.selectedDate.getDate()).toBe(now.getDate());
    expect(picker.selectedDate.getMonth()).toBe(now.getMonth());
  });

  it('should reset to a specific date when provided', () => {
    const picker = new EasyEpoch();
    const targetDate = new Date(2023, 8, 25); // Sep 25, 2023
    picker.reset(targetDate);
    expect(picker.selectedDate.getMonth()).toBe(8);
    expect(picker.selectedDate.getDate()).toBe(25);
  });

  it('should update the calendar display when reset', () => {
    const picker = new EasyEpoch();
    const targetDate = new Date(2024, 5, 15); // June 15, 2024
    picker.reset(targetDate);

    const monthAndYear = document.querySelector('.easyepoch-month-and-year');
    expect(monthAndYear!.innerHTML).toContain('June');
    expect(monthAndYear!.innerHTML).toContain('2024');
  });

  it('should update the time input value when reset', () => {
    const picker = new EasyEpoch();
    const targetDate = new Date(2024, 0, 1, 14, 30); // 2:30 PM
    picker.reset(targetDate);

    // The time input element gets the 24h value directly
    const timeInput = document.querySelector('.easyepoch-time-section input') as HTMLInputElement;
    expect(timeInput.value).toBe('14:30');
  });
});

describe('EasyEpoch.compactMode()', () => {
  it('should hide the date display when compact mode is enabled', () => {
    const picker = new EasyEpoch();
    picker.compactMode();
    const dateEl = document.querySelector('.easyepoch-date') as HTMLElement;
    expect(dateEl.style.display).toBe('none');
  });

  it('should be applied via constructor options', () => {
    const picker = new EasyEpoch({ compactMode: true });
    const dateEl = document.querySelector('.easyepoch-date') as HTMLElement;
    expect(dateEl.style.display).toBe('none');
  });
});

describe('EasyEpoch.disableTimeSection() / enableTimeSection()', () => {
  it('should hide the time icon when disabled', () => {
    const picker = new EasyEpoch();
    picker.disableTimeSection();
    const timeIcon = document.querySelector('.easyepoch-icon-time') as HTMLElement;
    expect(timeIcon.style.display).toBe('none');
  });

  it('should restore the time icon when re-enabled', () => {
    const picker = new EasyEpoch();
    picker.disableTimeSection();
    picker.enableTimeSection();
    const timeIcon = document.querySelector('.easyepoch-icon-time') as HTMLElement;
    expect(timeIcon.style.display).not.toBe('none');
  });

  it('should be applied via constructor options', () => {
    const picker = new EasyEpoch({ disableTimeSection: true });
    const timeIcon = document.querySelector('.easyepoch-icon-time') as HTMLElement;
    expect(timeIcon.style.display).toBe('none');
  });

  it('should hide the time display in the date header when disabled (issue #49)', () => {
    const picker = new EasyEpoch({ disableTimeSection: true });
    const timeDisplay = document.querySelector('.easyepoch-time') as HTMLElement;
    expect(timeDisplay.style.display).toBe('none');
  });

  it('should hide the time-section pane entirely when disabled (issue #49)', () => {
    const picker = new EasyEpoch({ disableTimeSection: true });
    const timeSection = document.querySelector('.easyepoch-time-section') as HTMLElement;
    expect(timeSection.style.display).toBe('none');
  });

  it('should produce a readableDate without a time component when disabled (issue #49)', () => {
    const picker = new EasyEpoch({
      selectedDate: new Date(2024, 5, 15, 14, 30),
      disableTimeSection: true,
    });
    let captured = '';
    picker.on('submit', (_d, readable) => { captured = readable as string; });
    picker.open();
    (document.querySelector('.easyepoch-ok-btn') as HTMLElement).click();

    expect(captured).not.toMatch(/\d{1,2}:\d{2}/);
    expect(captured).toMatch(/15th June 2024/);
  });

  it('should set selectedDate time to 00:00:00 when time is disabled (issue #49)', () => {
    const picker = new EasyEpoch({
      selectedDate: new Date(2024, 5, 15, 14, 30, 45),
      disableTimeSection: true,
    });
    let captured: Date | null = null;
    picker.on('submit', (d) => { captured = d as Date; });
    picker.open();
    (document.querySelector('.easyepoch-ok-btn') as HTMLElement).click();

    expect(captured).not.toBeNull();
    expect(captured!.getHours()).toBe(0);
    expect(captured!.getMinutes()).toBe(0);
    expect(captured!.getSeconds()).toBe(0);
  });
});

describe('EasyEpoch calendar rendering', () => {
  it('should render calendar cells with day numbers', () => {
    const picker = new EasyEpoch();
    const tds = document.querySelectorAll('.easyepoch-calender tbody td');
    const filledCells = Array.from(tds).filter(td => td.innerHTML.trim() !== '');
    // A month has at least 28 days
    expect(filledCells.length).toBeGreaterThanOrEqual(28);
    expect(filledCells.length).toBeLessThanOrEqual(31);
  });

  it('should mark the selected date as active', () => {
    const picker = new EasyEpoch();
    const activeTd = document.querySelector('.easyepoch-calender tbody td.active');
    expect(activeTd).not.toBeNull();
  });

  it('should display the correct month and year in the header', () => {
    const picker = new EasyEpoch();
    const now = new Date();
    const expectedMonth = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][now.getMonth()];

    const header = document.querySelector('.easyepoch-month-and-year');
    expect(header!.innerHTML).toContain(expectedMonth);
    expect(header!.innerHTML).toContain(now.getFullYear().toString());
  });
});

describe('EasyEpoch date selection', () => {
  it('should update selectedDate when a calendar cell is clicked', () => {
    const picker = new EasyEpoch();
    const tds = document.querySelectorAll('.easyepoch-calender tbody td');
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
    const picker = new EasyEpoch();
    const tds = document.querySelectorAll('.easyepoch-calender tbody td');
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
      const activeTds = document.querySelectorAll('.easyepoch-calender tbody td.active');
      expect(activeTds).toHaveLength(1);
    }
  });
});

describe('EasyEpoch month navigation', () => {
  it('should navigate to next month when next button is clicked', () => {
    const picker = new EasyEpoch();
    const now = new Date();
    const expectedNextMonth = (now.getMonth() + 1) % 12;
    const expectedMonthName = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][expectedNextMonth];

    // The next button is inside the simpilepicker-date-picker, we need to click it directly
    const nextBtn = document.querySelector('.easyepoch-icon-next') as HTMLElement;
    nextBtn.click();

    const selectedDate = document.querySelector('.easyepoch-selected-date');
    expect(selectedDate!.innerHTML).toContain(expectedMonthName);
  });

  it('should navigate to previous month when previous button is clicked', () => {
    const picker = new EasyEpoch();
    const now = new Date();
    const expectedPrevMonth = (now.getMonth() + 11) % 12;
    const expectedMonthName = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][expectedPrevMonth];

    const prevBtn = document.querySelector('.easyepoch-icon-previous') as HTMLElement;
    prevBtn.click();

    const selectedDate = document.querySelector('.easyepoch-selected-date');
    expect(selectedDate!.innerHTML).toContain(expectedMonthName);
  });
});

describe('EasyEpoch zIndex option', () => {
  it('should set z-index on the wrapper when provided', () => {
    const picker = new EasyEpoch({ zIndex: 1000 });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.style.zIndex).toBe('1000');
  });

  it('should not set z-index when not provided', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.style.zIndex).toBe('');
  });
});

describe('EasyEpoch multiple instances', () => {
  it('should allow creating multiple pickers on different elements', () => {
    const div1 = document.createElement('div');
    div1.className = 'picker-1';
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.className = 'picker-2';
    document.body.appendChild(div2);

    const picker1 = new EasyEpoch('.picker-1');
    const picker2 = new EasyEpoch('.picker-2');

    const wrappers = document.querySelectorAll('.easyepoch-wrapper');
    expect(wrappers.length).toBe(2);
  });

  it('should open/close independently', () => {
    const div1 = document.createElement('div');
    div1.className = 'picker-1';
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.className = 'picker-2';
    document.body.appendChild(div2);

    const picker1 = new EasyEpoch('.picker-1');
    const picker2 = new EasyEpoch('.picker-2');

    picker1.open();
    expect(div1.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(true);
    expect(div2.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(false);

    picker2.open();
    expect(div1.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(true);
    expect(div2.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(true);

    picker1.close();
    expect(div1.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(false);
    expect(div2.querySelector('.easyepoch-wrapper')!.classList.contains('active')).toBe(true);
  });
});

describe('EasyEpoch public properties', () => {
  it('should expose selectedDate as a Date object', () => {
    const picker = new EasyEpoch();
    expect(picker.selectedDate).toBeInstanceOf(Date);
  });

  it('should expose _eventHandlers object', () => {
    const picker = new EasyEpoch();
    expect(typeof picker._eventHandlers).toBe('object');
  });

  it('should expose _validOnListeners', () => {
    const picker = new EasyEpoch();
    expect(picker._validOnListeners).toContain('submit');
    expect(picker._validOnListeners).toContain('close');
  });
});

describe('EasyEpoch theming', () => {
  it('should use dark theme by default', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(false);
    expect(wrapper.classList.contains('easyepoch-theme-dark')).toBe(true);
  });

  it('should apply light theme via constructor option', () => {
    const picker = new EasyEpoch({ theme: 'light' });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(true);
  });

  it('should apply dark theme via constructor option', () => {
    const picker = new EasyEpoch({ theme: 'dark' });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('easyepoch-theme-dark')).toBe(true);
  });

  it('should apply custom theme object via constructor option', () => {
    const picker = new EasyEpoch({ theme: { bg: '#ff0000', text: '#00ff00' } });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--easyepoch-bg')).toBe('#ff0000');
    expect(wrapper.style.getPropertyValue('--easyepoch-text')).toBe('#00ff00');
  });

  it('should switch from dark to light theme at runtime with setTheme()', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    picker.setTheme('light');
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(true);
  });

  it('should switch from light to dark theme at runtime with setTheme()', () => {
    const picker = new EasyEpoch({ theme: 'light' });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(true);
    picker.setTheme('dark');
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(false);
    expect(wrapper.classList.contains('easyepoch-theme-dark')).toBe(true);
  });

  it('should apply custom theme object at runtime with setTheme()', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    picker.setTheme({ primary: '#ff6b6b', accent: '#ffd93d' });
    expect(wrapper.style.getPropertyValue('--easyepoch-primary')).toBe('#ff6b6b');
    expect(wrapper.style.getPropertyValue('--easyepoch-accent')).toBe('#ffd93d');
  });

  it('should clean up custom properties when switching from custom to built-in theme', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    picker.setTheme({ primary: '#ff6b6b' });
    expect(wrapper.style.getPropertyValue('--easyepoch-primary')).toBe('#ff6b6b');

    picker.setTheme('light');
    expect(wrapper.style.getPropertyValue('--easyepoch-primary')).toBe('');
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(true);
  });

  it('should accept custom properties with -- prefix', () => {
    const picker = new EasyEpoch();
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    picker.setTheme({ '--easyepoch-bg': '#123456' });
    expect(wrapper.style.getPropertyValue('--easyepoch-bg')).toBe('#123456');
  });

  it('should remove previous theme class when switching themes', () => {
    const picker = new EasyEpoch({ theme: 'light' });
    const wrapper = document.querySelector('.easyepoch-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(true);

    picker.setTheme('dark');
    expect(wrapper.classList.contains('easyepoch-theme-light')).toBe(false);
    expect(wrapper.classList.contains('easyepoch-theme-dark')).toBe(true);
  });
});

describe('EasyEpoch multiple pickers on same parent', () => {
  it('should not cross-contaminate when multiple pickers share the same parent', () => {
    const picker1 = new EasyEpoch();
    const picker2 = new EasyEpoch({ compactMode: true });
    const picker3 = new EasyEpoch({ disableTimeSection: true });

    const wrappers = document.querySelectorAll('.easyepoch-wrapper');
    expect(wrappers.length).toBe(3);

    // Each picker should control its own wrapper
    picker1.open();
    expect(wrappers[0].classList.contains('active')).toBe(true);
    expect(wrappers[1].classList.contains('active')).toBe(false);
    expect(wrappers[2].classList.contains('active')).toBe(false);
    picker1.close();

    picker2.open();
    expect(wrappers[0].classList.contains('active')).toBe(false);
    expect(wrappers[1].classList.contains('active')).toBe(true);
    expect(wrappers[2].classList.contains('active')).toBe(false);
    picker2.close();

    picker3.open();
    expect(wrappers[0].classList.contains('active')).toBe(false);
    expect(wrappers[1].classList.contains('active')).toBe(false);
    expect(wrappers[2].classList.contains('active')).toBe(true);
    picker3.close();
  });

  it('should not apply compactMode to other pickers wrappers', () => {
    const picker1 = new EasyEpoch();
    const picker2 = new EasyEpoch({ compactMode: true });

    const wrappers = document.querySelectorAll('.easyepoch-wrapper');
    const date1 = wrappers[0].querySelector('.easyepoch-date') as HTMLElement;
    const date2 = wrappers[1].querySelector('.easyepoch-date') as HTMLElement;

    expect(date1.style.display).not.toBe('none');
    expect(date2.style.display).toBe('none');
  });

  it('should apply setTheme to the correct picker when multiple exist', () => {
    const picker1 = new EasyEpoch();
    const picker2 = new EasyEpoch();

    const wrappers = document.querySelectorAll('.easyepoch-wrapper');

    picker1.setTheme('light');
    expect(wrappers[0].classList.contains('easyepoch-theme-light')).toBe(true);
    expect(wrappers[1].classList.contains('easyepoch-theme-light')).toBe(false);
  });
});

describe('EasyEpoch inline SVG icons', () => {
  it('should render SVG elements inside icon buttons', () => {
    const picker = new EasyEpoch();
    const icons = document.querySelectorAll('.easyepoch-icon');
    icons.forEach(icon => {
      const svg = icon.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });

  it('should use currentColor for stroke on SVG icons', () => {
    const picker = new EasyEpoch();
    const svg = document.querySelector('.easyepoch-icon svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('stroke')).toBe('currentColor');
  });
});

describe('Bug fixes', () => {
  describe('readableDate includes ordinal suffix', () => {
    it('readableDate should contain ordinal suffix like "1st"', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 0, 1, 12, 0) });
      picker.open();

      const okBtn = document.querySelector('.easyepoch-ok-btn') as HTMLElement;
      let capturedReadable = '';
      picker.on('submit', (_date, readable) => {
        capturedReadable = readable as string;
      });
      okBtn.click();

      expect(capturedReadable).toMatch(/^1st January 2024/);
    });
  });

  describe('clicking empty calendar cell is ignored', () => {
    it('should not select empty cells when clicked', () => {
      const picker = new EasyEpoch();
      const activeBefore = document.querySelector('.easyepoch-calender tbody td.active');
      const activeContentBefore = activeBefore ? activeBefore.innerHTML.trim() : '';

      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      let emptyTd: HTMLElement | null = null;
      tds.forEach(td => {
        if (td.getAttribute('data-empty') !== null) {
          emptyTd = td as HTMLElement;
        }
      });

      if (emptyTd) {
        (emptyTd as HTMLElement).click();
        // Active cell should not have changed
        const activeAfter = document.querySelector('.easyepoch-calender tbody td.active');
        expect(activeAfter).not.toBeNull();
        expect(activeAfter!.innerHTML.trim()).toBe(activeContentBefore);
        // The empty cell should not become active
        expect((emptyTd as HTMLElement).classList.contains('active')).toBe(false);
      }
    });
  });

  describe('error messages have correct function names', () => {
    it('scrapeNextMonth error message says "scrapeNextMonth"', () => {
      monthTracker.current = undefined;
      let errorMessage = '';
      try {
        scrapeNextMonth();
      } catch (e: any) {
        errorMessage = e.message;
      }
      expect(errorMessage).toContain('scrapeNextMonth');
    });
  });

  describe('easyepoch class name is spelled correctly', () => {
    it('inner picker div uses "easyepoch-date-picker"', () => {
      const picker = new EasyEpoch();
      expect(document.querySelector('.easyepoch-date-picker')).not.toBeNull();
      // The old typo should NOT exist
      expect(document.querySelector('.simpilepicker-date-picker')).toBeNull();
    });
  });

  describe('scrapeMonth handles months with exactly 4 calendar rows', () => {
    it('should not crash for February 2026 (starts Sunday, 28 days = exactly 4 rows)', () => {
      expect(() => scrapeMonth(new Date(2026, 1, 1))).not.toThrow();
    });
  });

  describe('multiple instances have independent month tracking', () => {
    it('navigating months in one picker should not affect another', () => {
      const div1 = document.createElement('div');
      div1.className = 'picker-a';
      document.body.appendChild(div1);

      const div2 = document.createElement('div');
      div2.className = 'picker-b';
      document.body.appendChild(div2);

      const picker1 = new EasyEpoch('.picker-a');
      const picker2 = new EasyEpoch('.picker-b');

      // Navigate picker1 forward
      const nextBtn1 = div1.querySelector('.easyepoch-icon-next') as HTMLElement;
      nextBtn1.click();

      // Picker2's selected-date should still show the current month
      const now = new Date();
      const currentMonthName = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ][now.getMonth()];

      const picker2SelectedDate = div2.querySelector('.easyepoch-selected-date');
      expect(picker2SelectedDate!.innerHTML).toContain(currentMonthName);
    });

    // Regression for upstream simplepicker#63: clicking next once advanced
    // BOTH pickers (and by 2 months instead of 1) due to a shared monthTracker.
    it('clicking next on one picker advances exactly one month on that picker only (issue #63)', () => {
      const div1 = document.createElement('div');
      document.body.appendChild(div1);
      const div2 = document.createElement('div');
      document.body.appendChild(div2);

      const startDate = new Date(2024, 0, 15); // January 2024
      const picker1 = new EasyEpoch(div1, { selectedDate: startDate });
      const picker2 = new EasyEpoch(div2, { selectedDate: startDate });

      (div1.querySelector('.easyepoch-icon-next') as HTMLElement).click();

      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      // picker1 should be exactly +1 month -> February
      expect(div1.querySelector('.easyepoch-selected-date')!.textContent)
        .toContain(months[1]);
      // picker2 should be untouched -> January
      expect(div2.querySelector('.easyepoch-selected-date')!.textContent)
        .toContain(months[0]);
    });

    it('clicking OK on one picker only fires submit for that picker (issue #63)', () => {
      const div1 = document.createElement('div');
      document.body.appendChild(div1);
      const div2 = document.createElement('div');
      document.body.appendChild(div2);

      const picker1 = new EasyEpoch(div1);
      const picker2 = new EasyEpoch(div2);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      picker1.on('submit', handler1);
      picker2.on('submit', handler2);

      picker1.open();
      (div1.querySelector('.easyepoch-ok-btn') as HTMLElement).click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('minDate / maxDate (issue #3)', () => {
    it('marks dates before minDate as data-disabled', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15), // June 15, 2024
        minDate: new Date(2024, 5, 10),      // June 10, 2024
      });
      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      const day5 = Array.from(tds).find(td => td.textContent!.trim() === '5');
      const day9 = Array.from(tds).find(td => td.textContent!.trim() === '9');
      const day10 = Array.from(tds).find(td => td.textContent!.trim() === '10');
      const day20 = Array.from(tds).find(td => td.textContent!.trim() === '20');

      expect(day5!.hasAttribute('data-disabled')).toBe(true);
      expect(day9!.hasAttribute('data-disabled')).toBe(true);
      expect(day10!.hasAttribute('data-disabled')).toBe(false);
      expect(day20!.hasAttribute('data-disabled')).toBe(false);
    });

    it('marks dates after maxDate as data-disabled', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        maxDate: new Date(2024, 5, 20),
      });
      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      const day20 = Array.from(tds).find(td => td.textContent!.trim() === '20');
      const day21 = Array.from(tds).find(td => td.textContent!.trim() === '21');
      const day25 = Array.from(tds).find(td => td.textContent!.trim() === '25');

      expect(day20!.hasAttribute('data-disabled')).toBe(false);
      expect(day21!.hasAttribute('data-disabled')).toBe(true);
      expect(day25!.hasAttribute('data-disabled')).toBe(true);
    });

    it('clicking a disabled cell does not change the selection', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        minDate: new Date(2024, 5, 10),
      });
      const before = picker.selectedDate.getDate();

      const disabledCell = document.querySelector(
        '.easyepoch-calender tbody td[data-disabled]'
      ) as HTMLElement;
      expect(disabledCell).not.toBeNull();
      disabledCell.click();

      expect(picker.selectedDate.getDate()).toBe(before);
      expect(disabledCell.classList.contains('active')).toBe(false);
    });

    it('updates data-disabled when navigating to a different month', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15), // June 2024
        maxDate: new Date(2024, 5, 30),      // June 30, 2024
      });
      // Navigate to July - all cells should now be disabled.
      (document.querySelector('.easyepoch-icon-next') as HTMLElement).click();

      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      const filledTds = Array.from(tds).filter(
        td => td.textContent!.trim() !== '' && !td.hasAttribute('data-empty')
      );
      const allDisabled = filledTds.every(td => td.hasAttribute('data-disabled'));
      expect(allDisabled).toBe(true);
    });

    it('treats minDate boundary as inclusive (same-day comparison)', () => {
      // Pass a minDate with a non-zero time-of-day; we should still allow the same calendar day.
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        minDate: new Date(2024, 5, 10, 23, 59, 59),
      });
      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      const day10 = Array.from(tds).find(td => td.textContent!.trim() === '10');
      expect(day10!.hasAttribute('data-disabled')).toBe(false);
    });
  });

  describe('showSeconds (issue #44)', () => {
    it('sets the time input step to 1 when showSeconds is on', () => {
      const picker = new EasyEpoch({ showSeconds: true });
      const input = document.querySelector(
        '.easyepoch-time-section input'
      ) as HTMLInputElement;
      expect(input.getAttribute('step')).toBe('1');
    });

    it('time display includes seconds when showSeconds is on', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 1, 14, 30, 45),
        showSeconds: true,
      });
      const timeEl = document.querySelector('.easyepoch-time')!;
      expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}:\d{2}\s(AM|PM)$/);
      expect(timeEl.textContent).toContain(':45');
    });

    it('preserves seconds in selectedDate after submit', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 1, 14, 30, 45),
        showSeconds: true,
      });
      let captured: Date | null = null;
      picker.on('submit', (d) => { captured = d as Date; });
      picker.open();
      (document.querySelector('.easyepoch-ok-btn') as HTMLElement).click();
      expect(captured).not.toBeNull();
      expect(captured!.getHours()).toBe(14);
      expect(captured!.getMinutes()).toBe(30);
      expect(captured!.getSeconds()).toBe(45);
    });

    it('readableDate includes seconds when showSeconds is on', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 1, 14, 30, 45),
        showSeconds: true,
      });
      let captured = '';
      picker.on('submit', (_d, r) => { captured = r as string; });
      picker.open();
      (document.querySelector('.easyepoch-ok-btn') as HTMLElement).click();
      expect(captured).toMatch(/02:30:45 PM/);
    });

    it('defaults to no seconds (HH:MM AM/PM)', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 1, 14, 30, 45),
      });
      const timeEl = document.querySelector('.easyepoch-time')!;
      expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}\s(AM|PM)$/);
    });
  });

  describe('locale / i18n (issue #70)', () => {
    const fr = {
      months: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
      ],
      days: [
        'Dimanche', 'Lundi', 'Mardi', 'Mercredi',
        'Jeudi', 'Vendredi', 'Samedi',
      ],
      daysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      ok: 'Valider',
      cancel: 'Annuler',
    };

    it('uses English by default', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 0, 1) });
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('January');
      const ok = document.querySelector('.easyepoch-ok-btn')!;
      const cancel = document.querySelector('.easyepoch-cancel-btn')!;
      expect(ok.textContent).toBe('OK');
      expect(cancel.textContent).toBe('Cancel');
      const ths = document.querySelectorAll('.easyepoch-calender thead th');
      expect(ths[0].textContent).toBe('Sun');
    });

    it('renders month names from a custom locale', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15), // June -> Juin
        locale: fr,
      });
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('Juin');
      expect(header.textContent).toContain('2024');
    });

    it('renders day-of-week header from a custom locale', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15), // a Saturday -> Samedi
        locale: fr,
      });
      const dayHeader = document.querySelector('.easyepoch-day-header')!;
      expect(dayHeader.textContent).toBe('Samedi');
    });

    it('renders calendar table headers from a custom locale', () => {
      const picker = new EasyEpoch({ locale: fr });
      const ths = document.querySelectorAll('.easyepoch-calender thead th');
      expect(Array.from(ths).map(th => th.textContent)).toEqual(fr.daysShort);
    });

    it('relabels the OK and Cancel buttons', () => {
      const picker = new EasyEpoch({ locale: fr });
      const ok = document.querySelector('.easyepoch-ok-btn')!;
      const cancel = document.querySelector('.easyepoch-cancel-btn')!;
      expect(ok.textContent).toBe('Valider');
      expect(cancel.textContent).toBe('Annuler');
      expect(ok.getAttribute('title')).toBe('Valider');
      expect(cancel.getAttribute('title')).toBe('Annuler');
    });

    it('honors per-string title overrides distinct from labels', () => {
      const picker = new EasyEpoch({
        locale: {
          ok: 'Go', okTitle: 'Confirm selection',
          cancel: 'Back', cancelTitle: 'Abort selection',
        },
      });
      const ok = document.querySelector('.easyepoch-ok-btn')!;
      const cancel = document.querySelector('.easyepoch-cancel-btn')!;
      expect(ok.textContent).toBe('Go');
      expect(ok.getAttribute('title')).toBe('Confirm selection');
      expect(cancel.textContent).toBe('Back');
      expect(cancel.getAttribute('title')).toBe('Abort selection');
    });

    it('mirrors cancel label into cancelTitle when only the label is set', () => {
      const picker = new EasyEpoch({ locale: { cancel: 'Annuler' } });
      const cancel = document.querySelector('.easyepoch-cancel-btn')!;
      expect(cancel.textContent).toBe('Annuler');
      expect(cancel.getAttribute('title')).toBe('Annuler');
    });

    it('applies icon-button tooltip overrides', () => {
      const picker = new EasyEpoch({
        locale: {
          selectDateTitle: 'Choisir la date',
          selectTimeTitle: "Choisir l'heure",
        },
      });
      const calenderIcon = document.querySelector('.easyepoch-icon-calender')!;
      const timeIcon = document.querySelector('.easyepoch-icon-time')!;
      expect(calenderIcon.getAttribute('title')).toBe('Choisir la date');
      expect(timeIcon.getAttribute('title')).toBe("Choisir l'heure");
    });

    it('default selectDateTitle uses correct "calendar" spelling', () => {
      const picker = new EasyEpoch();
      const calenderIcon = document.querySelector('.easyepoch-icon-calender')!;
      expect(calenderIcon.getAttribute('title')).toBe('Select date from calendar!');
    });

    it('falls back to defaults when fields are explicitly undefined', () => {
      // Spread-merge would overwrite defaults with undefined; resolveLocale
      // must reject undefined entries.
      const picker = new EasyEpoch({
        locale: {
          months: undefined, days: undefined, daysShort: undefined,
          ok: undefined, cancel: undefined,
        } as any,
      });
      const ths = document.querySelectorAll('.easyepoch-calender thead th');
      expect(ths[0].textContent).toBe('Sun');
      expect(document.querySelector('.easyepoch-ok-btn')!.textContent).toBe('OK');
      expect(document.querySelector('.easyepoch-cancel-btn')!.textContent).toBe('Cancel');
    });

    it('rejects malformed locale arrays of the wrong length', () => {
      // Eleven months: invalid. Falls back to default English months.
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        locale: { months: ['M' + 1, 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'] } as any,
      });
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('June');
    });

    it('rejects locale arrays containing non-string entries', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        locale: {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 12 as any],
        } as any,
      });
      const header = document.querySelector('.easyepoch-month-and-year')!;
      // June is index 5 — would have been valid even with a bad December entry,
      // but the whole array is rejected. Falls back to "June".
      expect(header.textContent).toContain('June');
    });

    it('rejects empty-string overrides', () => {
      const picker = new EasyEpoch({ locale: { ok: '', cancel: '' } });
      expect(document.querySelector('.easyepoch-ok-btn')!.textContent).toBe('OK');
      expect(document.querySelector('.easyepoch-cancel-btn')!.textContent).toBe('Cancel');
    });

    it('parses the localized header back into selectedDate after navigation', () => {
      // Regression: updateSelectedDate must understand the localized month name.
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 15),
        locale: fr,
      });
      // Click next to navigate Janvier -> Février
      (document.querySelector('.easyepoch-icon-next') as HTMLElement).click();
      // Header should now read "Février 2024"
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('Février');
      // selectedDate.getMonth() should be 1 (February), not -1 or 0
      expect(picker.selectedDate.getMonth()).toBe(1);
    });

    it('preserves locale when picking a new date in the same month', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 1),
        locale: fr,
      });
      const tds = document.querySelectorAll('.easyepoch-calender tbody td');
      const day20 = Array.from(tds).find(td => td.textContent!.trim() === '20') as HTMLElement;
      day20.click();
      expect(picker.selectedDate.getDate()).toBe(20);
      expect(picker.selectedDate.getMonth()).toBe(5);
    });

    it('falls back to defaults for unspecified locale fields', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 0, 1),
        locale: { ok: 'Go' }, // months/days/cancel/etc unspecified
      });
      // Defaults still apply where not overridden.
      const cancel = document.querySelector('.easyepoch-cancel-btn')!;
      expect(cancel.textContent).toBe('Cancel');
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('January');
    });

    it('keyboard navigation works under a custom locale (issue #70 + #1)', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 15),
        locale: fr,
      });
      picker.open();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight', bubbles: true, cancelable: true,
      }));
      expect(picker.selectedDate.getDate()).toBe(16);
    });
  });

  describe('keyboard navigation (issue #1)', () => {
    function key(name: string, opts: { shiftKey?: boolean } = {}) {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: name, bubbles: true, cancelable: true, ...opts,
      }));
    }

    it('ArrowRight advances the selected date by one day', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('ArrowRight');
      expect(picker.selectedDate.getDate()).toBe(16);
      expect(picker.selectedDate.getMonth()).toBe(5);
    });

    it('ArrowLeft moves the selected date back by one day', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('ArrowLeft');
      expect(picker.selectedDate.getDate()).toBe(14);
    });

    it('ArrowDown advances by 7 days', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('ArrowDown');
      expect(picker.selectedDate.getDate()).toBe(22);
    });

    it('ArrowUp moves back by 7 days', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('ArrowUp');
      expect(picker.selectedDate.getDate()).toBe(8);
    });

    it('ArrowRight on the last day of the month rolls into the next month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 0, 31) });
      picker.open();
      key('ArrowRight');
      expect(picker.selectedDate.getMonth()).toBe(1); // February
      expect(picker.selectedDate.getDate()).toBe(1);
      // Rendered calendar header should reflect the new month
      const header = document.querySelector('.easyepoch-month-and-year')!;
      expect(header.textContent).toContain('February');
    });

    it('ArrowLeft on day 1 rolls into the previous month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 1) });
      picker.open();
      key('ArrowLeft');
      expect(picker.selectedDate.getMonth()).toBe(4); // May
      expect(picker.selectedDate.getDate()).toBe(31);
    });

    it('PageDown advances by one month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('PageDown');
      expect(picker.selectedDate.getMonth()).toBe(6); // July
      expect(picker.selectedDate.getDate()).toBe(15);
    });

    it('PageUp moves back one month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('PageUp');
      expect(picker.selectedDate.getMonth()).toBe(4); // May
    });

    it('PageDown clamps day when target month is shorter (Jan 31 -> Feb 28/29)', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2023, 0, 31) });
      picker.open();
      key('PageDown');
      // 2023 is not a leap year -> Feb 28
      expect(picker.selectedDate.getMonth()).toBe(1);
      expect(picker.selectedDate.getDate()).toBe(28);
    });

    it('Shift+PageDown advances by one year', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('PageDown', { shiftKey: true });
      expect(picker.selectedDate.getFullYear()).toBe(2025);
      expect(picker.selectedDate.getMonth()).toBe(5);
    });

    it('Home moves to the first day of the current month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('Home');
      expect(picker.selectedDate.getDate()).toBe(1);
      expect(picker.selectedDate.getMonth()).toBe(5);
    });

    it('End moves to the last day of the current month', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      key('End');
      expect(picker.selectedDate.getDate()).toBe(30); // June has 30 days
    });

    it('Enter triggers submit and closes the picker', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      const handler = vi.fn();
      picker.on('submit', handler);
      picker.open();
      key('Enter');
      expect(handler).toHaveBeenCalledTimes(1);
      const wrapper = document.querySelector('.easyepoch-wrapper')!;
      expect(wrapper.classList.contains('active')).toBe(false);
    });

    it('Escape triggers close (not submit)', () => {
      const picker = new EasyEpoch();
      const submit = vi.fn();
      const close = vi.fn();
      picker.on('submit', submit);
      picker.on('close', close);
      picker.open();
      key('Escape');
      expect(submit).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledTimes(1);
    });

    it('does not handle keys when the picker is closed', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      const before = picker.selectedDate.getDate();
      // never opened
      key('ArrowRight');
      expect(picker.selectedDate.getDate()).toBe(before);
    });

    it('does not hijack ArrowRight while typing in the time input', () => {
      const picker = new EasyEpoch({ selectedDate: new Date(2024, 5, 15) });
      picker.open();
      const before = picker.selectedDate.getDate();
      const input = document.querySelector('.easyepoch-time-section input') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight', bubbles: true, cancelable: true,
      }));
      expect(picker.selectedDate.getDate()).toBe(before);
    });

    it('refuses to move into a disabled (out-of-range) cell', () => {
      const picker = new EasyEpoch({
        selectedDate: new Date(2024, 5, 10),
        minDate: new Date(2024, 5, 10),
      });
      picker.open();
      key('ArrowLeft'); // would move to June 9 — disabled
      expect(picker.selectedDate.getDate()).toBe(10);
    });

    it('routes keys only to the open picker when multiple instances exist (issue #63)', () => {
      const div1 = document.createElement('div');
      document.body.appendChild(div1);
      const div2 = document.createElement('div');
      document.body.appendChild(div2);

      const start = new Date(2024, 5, 15);
      const picker1 = new EasyEpoch(div1, { selectedDate: start });
      const picker2 = new EasyEpoch(div2, { selectedDate: start });

      picker1.open(); // picker2 stays closed
      key('ArrowRight');
      expect(picker1.selectedDate.getDate()).toBe(16);
      expect(picker2.selectedDate.getDate()).toBe(15);
    });
  });
});

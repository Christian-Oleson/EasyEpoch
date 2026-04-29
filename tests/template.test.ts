import { describe, it, expect } from 'vitest';
import { htmlTemplate } from '../lib/template';

describe('htmlTemplate', () => {
  it('should be a non-empty string', () => {
    expect(typeof htmlTemplate).toBe('string');
    expect(htmlTemplate.length).toBeGreaterThan(0);
  });

  it('should contain the wrapper class', () => {
    expect(htmlTemplate).toContain('easyepoch-wrapper');
  });

  it('should contain the date picker class', () => {
    expect(htmlTemplate).toContain('easyepoch-date-picker');
  });

  it('should contain the day header', () => {
    expect(htmlTemplate).toContain('easyepoch-day-header');
  });

  it('should contain the date section elements', () => {
    expect(htmlTemplate).toContain('easyepoch-month-and-year');
    expect(htmlTemplate).toContain('easyepoch-date');
    expect(htmlTemplate).toContain('easyepoch-select-pane');
  });

  it('should contain calendar and time icons', () => {
    expect(htmlTemplate).toContain('easyepoch-icon-calender');
    expect(htmlTemplate).toContain('easyepoch-icon-time');
  });

  it('should contain inline SVG elements in icon buttons', () => {
    expect(htmlTemplate).toContain('<svg');
    expect(htmlTemplate).toContain('currentColor');
  });

  it('should contain the time display with default value', () => {
    expect(htmlTemplate).toContain('easyepoch-time');
    expect(htmlTemplate).toContain('12:00 PM');
  });

  it('should contain the calendar section with table', () => {
    expect(htmlTemplate).toContain('easyepoch-calender-section');
    // The table now carries role="grid" for assistive tech.
    expect(htmlTemplate).toMatch(/<table[^>]*>/);
    expect(htmlTemplate).toContain('role="grid"');
    expect(htmlTemplate).toContain('<thead>');
    expect(htmlTemplate).toContain('<tbody>');
  });

  it('should contain all 7 day headers in the table', () => {
    // Day-of-week headers carry scope="col" for screen readers.
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
      expect(htmlTemplate).toMatch(new RegExp(`<th[^>]*>${d}</th>`));
    });
  });

  it('should contain 6 rows of calendar cells (6 <tr> in tbody)', () => {
    const tbodyMatch = htmlTemplate.match(/<tbody>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    const trCount = (tbodyMatch![1].match(/<tr[^>]*>/g) || []).length;
    expect(trCount).toBe(6);
  });

  it('should contain 42 td cells (6 rows x 7 cols)', () => {
    const tbodyMatch = htmlTemplate.match(/<tbody>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    const tdCount = (tbodyMatch![1].match(/<td[^>]*>/g) || []).length;
    expect(tdCount).toBe(42);
  });

  it('should contain month navigation buttons', () => {
    expect(htmlTemplate).toContain('easyepoch-icon-previous');
    expect(htmlTemplate).toContain('easyepoch-icon-next');
    expect(htmlTemplate).toContain('easyepoch-selected-date');
  });

  it('should contain the time input section', () => {
    expect(htmlTemplate).toContain('easyepoch-time-section');
    expect(htmlTemplate).toContain('type="time"');
    expect(htmlTemplate).toContain('value="12:00"');
  });

  it('should contain Cancel and OK buttons', () => {
    expect(htmlTemplate).toContain('easyepoch-cancel-btn');
    expect(htmlTemplate).toContain('easyepoch-ok-btn');
    expect(htmlTemplate).toContain('>Cancel</button>');
    expect(htmlTemplate).toContain('>OK</button>');
  });

  it('should be valid HTML when parsed', () => {
    const container = document.createElement('div');
    container.innerHTML = htmlTemplate;
    expect(container.querySelector('.easyepoch-wrapper')).not.toBeNull();
    expect(container.querySelector('.easyepoch-date-picker')).not.toBeNull();
    expect(container.querySelector('.easyepoch-calender')).not.toBeNull();
  });
});

import { htmlTemplate } from '../lib/template';

describe('htmlTemplate', () => {
  it('should be a non-empty string', () => {
    expect(typeof htmlTemplate).toBe('string');
    expect(htmlTemplate.length).toBeGreaterThan(0);
  });

  it('should contain the wrapper class', () => {
    expect(htmlTemplate).toContain('simplepicker-wrapper');
  });

  it('should contain the date picker class (note: known typo "simpilepicker")', () => {
    expect(htmlTemplate).toContain('simpilepicker-date-picker');
  });

  it('should contain the day header', () => {
    expect(htmlTemplate).toContain('simplepicker-day-header');
  });

  it('should contain the date section elements', () => {
    expect(htmlTemplate).toContain('simplepicker-month-and-year');
    expect(htmlTemplate).toContain('simplepicker-date');
    expect(htmlTemplate).toContain('simplepicker-select-pane');
  });

  it('should contain calendar and time icons', () => {
    expect(htmlTemplate).toContain('simplepicker-icon-calender');
    expect(htmlTemplate).toContain('simplepicker-icon-time');
  });

  it('should contain the time display with default value', () => {
    expect(htmlTemplate).toContain('simplepicker-time');
    expect(htmlTemplate).toContain('12:00 PM');
  });

  it('should contain the calendar section with table', () => {
    expect(htmlTemplate).toContain('simplepicker-calender-section');
    expect(htmlTemplate).toContain('<table>');
    expect(htmlTemplate).toContain('<thead>');
    expect(htmlTemplate).toContain('<tbody>');
  });

  it('should contain all 7 day headers in the table', () => {
    expect(htmlTemplate).toContain('<th>Sun</th>');
    expect(htmlTemplate).toContain('<th>Mon</th>');
    expect(htmlTemplate).toContain('<th>Tue</th>');
    expect(htmlTemplate).toContain('<th>Wed</th>');
    expect(htmlTemplate).toContain('<th>Thu</th>');
    expect(htmlTemplate).toContain('<th>Fri</th>');
    expect(htmlTemplate).toContain('<th>Sat</th>');
  });

  it('should contain 6 rows of calendar cells (6 <tr> in tbody)', () => {
    const tbodyMatch = htmlTemplate.match(/<tbody>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    const trCount = (tbodyMatch![1].match(/<tr>/g) || []).length;
    expect(trCount).toBe(6);
  });

  it('should contain 42 td cells (6 rows x 7 cols)', () => {
    const tbodyMatch = htmlTemplate.match(/<tbody>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    const tdCount = (tbodyMatch![1].match(/<td>/g) || []).length;
    expect(tdCount).toBe(42);
  });

  it('should contain month navigation buttons', () => {
    expect(htmlTemplate).toContain('simplepicker-icon-previous');
    expect(htmlTemplate).toContain('simplepicker-icon-next');
    expect(htmlTemplate).toContain('simplepicker-selected-date');
  });

  it('should contain the time input section', () => {
    expect(htmlTemplate).toContain('simplepicker-time-section');
    expect(htmlTemplate).toContain('type="time"');
    expect(htmlTemplate).toContain('value="12:00"');
  });

  it('should contain Cancel and OK buttons', () => {
    expect(htmlTemplate).toContain('simplepicker-cancel-btn');
    expect(htmlTemplate).toContain('simplepicker-ok-btn');
    expect(htmlTemplate).toContain('>Cancel</button>');
    expect(htmlTemplate).toContain('>OK</button>');
  });

  it('should be valid HTML when parsed', () => {
    const container = document.createElement('div');
    container.innerHTML = htmlTemplate;
    expect(container.querySelector('.simplepicker-wrapper')).not.toBeNull();
    expect(container.querySelector('.simpilepicker-date-picker')).not.toBeNull();
    expect(container.querySelector('.simplepicker-calender')).not.toBeNull();
  });
});

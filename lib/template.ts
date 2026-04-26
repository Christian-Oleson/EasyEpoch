const calendarRow = '<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const iconPrevious = `<svg ${svgAttrs}><polyline points="15 18 9 12 15 6"></polyline></svg>`;
const iconNext = `<svg ${svgAttrs}><polyline points="9 18 15 12 9 6"></polyline></svg>`;
const iconCalender = `<svg ${svgAttrs}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const iconTime = `<svg ${svgAttrs}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

export const htmlTemplate = `
<div class="easyepoch-wrapper">
  <div class="easyepoch-date-picker">
    <div class="easyepoch-day-header"></div>
      <div class="easyepoch-date-section">
        <div class="easyepoch-month-and-year"></div>
        <div class="easyepoch-date"></div>
        <div class="easyepoch-select-pane">
          <button type="button" class="easyepoch-icon easyepoch-icon-calender active" title="Select date from calendar!">${iconCalender}</button>
          <div class="easyepoch-time">12:00 PM</div>
          <button type="button" class="easyepoch-icon easyepoch-icon-time" title="Select time">${iconTime}</button>
        </div>
      </div>
      <div class="easyepoch-picker-section">
        <div class="easyepoch-calender-section">
          <div class="easyepoch-month-switcher easyepoch-select-pane">
            <button type="button" class="easyepoch-icon easyepoch-icon-previous">${iconPrevious}</button>
            <div class="easyepoch-selected-date"></div>
            <button type="button" class="easyepoch-icon easyepoch-icon-next">${iconNext}</button>
          </div>
          <div class="easyepoch-calender">
            <table>
              <thead>
                <tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr>
              </thead>
              <tbody>
                ${ calendarRow.repeat(6) }
              </tbody>
            </table>
          </div>
        </div>
        <div class="easyepoch-time-section">
          <input type="time" value="12:00" autofocus="false">
        </div>
      </div>
      <div class="easyepoch-bottom-part">
        <button type="button" class="easyepoch-cancel-btn easyepoch-btn" title="Cancel">Cancel</button>
        <button type="button" class="easyepoch-ok-btn easyepoch-btn" title="OK">OK</button>
      </div>
  </div>
</div>
`;

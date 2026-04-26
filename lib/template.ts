const calendarRow = '<tr role="row"><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td><td role="gridcell"></td></tr>';

const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

const iconPrevious = `<svg ${svgAttrs}><polyline points="15 18 9 12 15 6"></polyline></svg>`;
const iconNext = `<svg ${svgAttrs}><polyline points="9 18 15 12 9 6"></polyline></svg>`;
const iconCalender = `<svg ${svgAttrs}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const iconTime = `<svg ${svgAttrs}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

export const htmlTemplate = `
<div class="easyepoch-wrapper" role="dialog" aria-modal="true" aria-label="Date picker">
  <div class="easyepoch-date-picker">
    <div class="easyepoch-day-header"></div>
      <div class="easyepoch-date-section">
        <div class="easyepoch-month-and-year"></div>
        <div class="easyepoch-date"></div>
        <div class="easyepoch-select-pane">
          <button type="button" class="easyepoch-icon easyepoch-icon-calender active" title="Select date from calendar!" aria-label="Select date from calendar">${iconCalender}</button>
          <div class="easyepoch-time">12:00 PM</div>
          <button type="button" class="easyepoch-icon easyepoch-icon-time" title="Select time" aria-label="Select time">${iconTime}</button>
        </div>
      </div>
      <div class="easyepoch-picker-section">
        <div class="easyepoch-calender-section">
          <div class="easyepoch-month-switcher easyepoch-select-pane">
            <button type="button" class="easyepoch-icon easyepoch-icon-previous" title="Previous month" aria-label="Previous month">${iconPrevious}</button>
            <div class="easyepoch-selected-date" aria-live="polite"></div>
            <button type="button" class="easyepoch-icon easyepoch-icon-next" title="Next month" aria-label="Next month">${iconNext}</button>
          </div>
          <div class="easyepoch-calender">
            <table role="grid">
              <thead>
                <tr role="row"><th scope="col">Sun</th><th scope="col">Mon</th><th scope="col">Tue</th><th scope="col">Wed</th><th scope="col">Thu</th><th scope="col">Fri</th><th scope="col">Sat</th></tr>
              </thead>
              <tbody>
                ${ calendarRow.repeat(6) }
              </tbody>
            </table>
          </div>
        </div>
        <div class="easyepoch-time-section">
          <input type="time" value="12:00" autofocus="false" aria-label="Time">
        </div>
      </div>
      <div class="easyepoch-bottom-part">
        <button type="button" class="easyepoch-cancel-btn easyepoch-btn" title="Cancel">Cancel</button>
        <button type="button" class="easyepoch-ok-btn easyepoch-btn" title="OK">OK</button>
      </div>
  </div>
</div>
`;

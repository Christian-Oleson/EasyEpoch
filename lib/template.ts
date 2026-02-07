const calendarRow = '<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

export const htmlTemplate = `
<div class="easyepoch-wrapper">
  <div class="easyepoch-date-picker">
    <div class="easyepoch-day-header"></div>
      <div class="easyepoch-date-section">
        <div class="easyepoch-month-and-year"></div>
        <div class="easyepoch-date"></div>
        <div class="easyepoch-select-pane">
          <button type="button" class="easyepoch-icon easyepoch-icon-calender active" title="Select date from calender!"></button>
          <div class="easyepoch-time">12:00 PM</div>
          <button type="button" class="easyepoch-icon easyepoch-icon-time" title="Select time"></button>
        </div>
      </div>
      <div class="easyepoch-picker-section">
        <div class="easyepoch-calender-section">
          <div class="easyepoch-month-switcher easyepoch-select-pane">
            <button type="button" class="easyepoch-icon easyepoch-icon-previous"></button>
            <div class="easyepoch-selected-date"></div>
            <button type="button" class="easyepoch-icon easyepoch-icon-next"></button>
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

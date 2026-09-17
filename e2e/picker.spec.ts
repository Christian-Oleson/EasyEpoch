import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

// These run against a real Chromium and the real built bundle, covering what
// the jsdom suite structurally cannot: actual focus behaviour, CSS-driven
// visibility, and the browser's own event dispatch.
const FIXTURE = pathToFileURL(join(__dirname, 'fixture.html')).href;

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE);
});

const wrapper = '.easyepoch-wrapper';
const activeCell = '.easyepoch-calender tbody td.active';

test('opens as a modal dialog and moves focus into it', async ({ page }) => {
  await expect(page.locator(wrapper)).toBeHidden();

  await page.click('#open');

  const dialog = page.locator(wrapper);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  // Focus must land inside the dialog, not stay on the trigger button.
  const focusInside = await page.evaluate(
    (sel) => !!document.activeElement?.closest(sel),
    wrapper,
  );
  expect(focusInside).toBe(true);
});

test('keyboard navigation moves the selected day', async ({ page }) => {
  await page.click('#open');
  await expect(page.locator(activeCell)).toHaveText('15');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator(activeCell)).toHaveText('16');

  await page.keyboard.press('ArrowDown');
  await expect(page.locator(activeCell)).toHaveText('23');

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(activeCell)).toHaveText('22');

  // Exactly one cell is in the tab sequence (roving tabindex).
  await expect(page.locator('.easyepoch-calender tbody td[tabindex="0"]')).toHaveCount(1);
});

test('picking a date and confirming emits the readable date', async ({ page }) => {
  await page.click('#open');
  await page.click('.easyepoch-calender tbody td:text-is("20")');
  await page.click('.easyepoch-ok-btn');

  await expect(page.locator(wrapper)).toBeHidden();
  await expect(page.locator('#out')).toHaveText(/^20th June 2024 01:30 PM$/);
});

test('Escape cancels and restores focus to the trigger', async ({ page }) => {
  await page.click('#open');
  await expect(page.locator(wrapper)).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.locator(wrapper)).toBeHidden();
  await expect(page.locator('#closed')).toHaveText('closed');
  await expect(page.locator('#open')).toBeFocused();
});

test('Tab is trapped inside the dialog', async ({ page }) => {
  await page.click('#open');

  // Tab well past the number of focusables; focus must never escape to the
  // page behind the modal.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      (sel) => !!document.activeElement?.closest(sel),
      wrapper,
    );
    expect(inside, `focus escaped the dialog after ${i + 1} Tab press(es)`).toBe(true);
  }
});

test('switching to the time pane reveals the time input', async ({ page }) => {
  await page.click('#open');

  const timeInput = page.locator('.easyepoch-time-section input');
  await expect(timeInput).toBeHidden();

  await page.click('.easyepoch-icon-time');
  await expect(timeInput).toBeVisible();
  await expect(timeInput).toHaveValue('13:30');

  await page.click('.easyepoch-icon-calender');
  await expect(timeInput).toBeHidden();
});

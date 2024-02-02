// @ts-check
const { test, expect } = require('@playwright/test');
const { ReportingApi } = require('../src/reportingApi');

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('has one tag at the end @single', async ({ page }) => {
  ReportingApi.addAttributes([
    {
      value: 'single',
    },
  ]);

  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('@single has one tag at the beginning', async ({ page }) => {
  ReportingApi.addAttributes([
    {
      value: 'single',
    },
  ]);

  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('has no tag', async ({ page }) => {
  ReportingApi.addAttributes([]);

  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
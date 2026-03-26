import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('redirects root URL to language-prefixed route', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en-US|it-IT)\//);
  });

  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rihigo/);
  });

  test('homepage displays hero section with H1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigates to activities page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Explore Activities');
    await expect(page).toHaveURL(/\/activities/);
  });
});

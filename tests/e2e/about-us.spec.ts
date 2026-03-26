import { test, expect } from '@playwright/test';

test.describe('About Us', () => {
  test('page loads and has correct content', async ({ page }) => {
    await page.goto('/en-US/about-us/');

    await expect(page).toHaveTitle(/About us • Rihigo/);

    // Hero section
    await expect(page.getByRole('heading', { name: 'About Rihigo' })).toBeVisible();
    await expect(page.getByText('Your trusted travel companion')).toBeVisible();

    // Story section
    await expect(page.getByRole('heading', { name: 'Our Story' })).toBeVisible();
    await expect(page.getByText('Born from the Ocean')).toBeVisible();

    // Values section
    await expect(page.getByRole('heading', { name: 'Our Values' })).toBeVisible();
    await expect(page.getByText('Authenticity')).toBeVisible();

    // Team section
    await expect(page.getByRole('heading', { name: 'Our Team' })).toBeVisible();
    await expect(page.getByText('Ahmed Niyaz')).toBeVisible();
  });
});

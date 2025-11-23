import { test, expect } from '@playwright/test';

test('about us page loads and has correct content', async ({ page }) => {
    await page.goto('/en-US/about-us/');

    // Check title
    await expect(page).toHaveTitle(/About us • Rihigo/);

    // Check Hero section
    await expect(page.getByRole('heading', { name: 'About Rihigo' })).toBeVisible();
    await expect(page.getByText('Your trusted travel companion')).toBeVisible();

    // Check Story section
    await expect(page.getByRole('heading', { name: 'Our Story' })).toBeVisible();
    await expect(page.getByText('Born from the Ocean')).toBeVisible();

    // Check Mission section
    await expect(page.getByRole('heading', { name: 'Our Values' })).toBeVisible();
    await expect(page.getByText('Authenticity')).toBeVisible();

    // Check Team section
    await expect(page.getByRole('heading', { name: 'Our Team' })).toBeVisible();
    await expect(page.getByText('Ahmed Niyaz')).toBeVisible();
});

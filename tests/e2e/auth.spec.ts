import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('sign-in page shows Google button', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test('admin panel redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/sign/);
    await expect(page).toHaveURL(/callbackUrl/);
  });
});

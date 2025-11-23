import { test, expect } from '@playwright/test';

test.describe('Signup Page Debug', () => {
  test('inspect signup page', async ({ page }) => {
    // Navigate to signup page
    await page.goto('http://localhost:5173/auth/signup/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'signup-page.png', fullPage: true });

    // Get page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Get URL
    console.log('Current URL:', page.url());

    // Check for any visible errors
    const errorMessages = await page.locator('.error, .alert-error, [role="alert"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error Messages:', errorMessages);
    }

    // Get all headings
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headings:', headings);

    // Check for form elements
    const inputs = await page.locator('input').count();
    console.log('Number of inputs:', inputs);

    const buttons = await page.locator('button').count();
    console.log('Number of buttons:', buttons);

    // Get button text
    const buttonTexts = await page.locator('button').allTextContents();
    console.log('Buttons:', buttonTexts);

    // Check if redirected
    const currentUrl = page.url();
    if (!currentUrl.includes('/auth/signup')) {
      console.log('REDIRECTED! New URL:', currentUrl);
    }

    // Pause for manual inspection
    await page.pause();
  });

  test('check for console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== Page Errors ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No page errors');
    }

    // Pause for inspection
    await page.pause();
  });

  test('check network requests', async ({ page }) => {
    const requests: string[] = [];
    const failedRequests: string[] = [];

    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    page.on('requestfailed', request => {
      failedRequests.push(`FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Network Requests ===');
    requests.forEach(req => console.log(req));

    console.log('\n=== Failed Requests ===');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => console.log(req));
    } else {
      console.log('No failed requests');
    }

    await page.pause();
  });
});

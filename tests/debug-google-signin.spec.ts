import { test, expect } from '@playwright/test';

test.describe('Google Sign In Debug', () => {
  test('inspect google signin button click', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    const requests: string[] = [];
    const responses: Map<string, number> = new Map();

    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      errors.push(`ERROR: ${error.message}`);
    });

    // Capture network requests
    page.on('request', request => {
      requests.push(`REQUEST: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      responses.set(response.url(), response.status());
    });

    // Navigate to signup page
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Initial Page Load ===');
    console.log('Current URL:', page.url());

    // Find the Google button
    const googleButton = page.locator('button:has-text("Continue with Google")').first();
    await expect(googleButton).toBeVisible();

    console.log('\n=== Button State Before Click ===');
    const isDisabled = await googleButton.isDisabled();
    console.log('Button disabled:', isDisabled);

    const buttonType = await googleButton.getAttribute('type');
    console.log('Button type:', buttonType);

    // Click the button
    console.log('\n=== Clicking Google Button ===');
    await googleButton.click();

    // Wait a bit to see what happens
    await page.waitForTimeout(2000);

    console.log('\n=== After Click ===');
    console.log('Current URL:', page.url());
    console.log('URL changed:', page.url() !== 'http://localhost:5173/auth/signup/');

    // Check for any new network activity
    console.log('\n=== Network Requests (last 10) ===');
    requests.slice(-10).forEach(req => console.log(req));

    // Check for errors
    console.log('\n=== Errors ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No errors captured');
    }

    // Check console messages
    console.log('\n=== Console Messages (last 10) ===');
    consoleMessages.slice(-10).forEach(msg => console.log(msg));

    // Pause for manual inspection
    await page.pause();
  });

  test('check signup page component code', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    // Check the actual button HTML
    const googleButton = page.locator('button:has-text("Continue with Google")').first();

    // Get button attributes
    const outerHTML = await googleButton.evaluate(el => el.outerHTML);
    console.log('\n=== Google Button HTML ===');
    console.log(outerHTML);

    // Check if there's a form around it
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      const formHTML = await form.evaluate(el => el.outerHTML.substring(0, 500));
      console.log('\n=== Form HTML (first 500 chars) ===');
      console.log(formHTML);
    }

    // Check for onClick handlers
    const hasOnClick = await googleButton.evaluate(el => {
      return {
        hasOnClick: el.hasAttribute('onclick'),
        hasQwikListeners: Object.keys(el).filter(k => k.startsWith('__')).length > 0
      };
    });
    console.log('\n=== Event Handlers ===');
    console.log(hasOnClick);

    await page.pause();
  });
});

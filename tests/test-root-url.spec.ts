import { test, expect } from '@playwright/test';

test.describe('Root URL Redirect', () => {
  test('should redirect from / to /en-US/', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(`ERROR: ${error.message}`);
    });

    console.log('\n=== Testing Root URL Redirect ===');

    // Navigate to root
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Take screenshot
    await page.screenshot({ path: 'root-url-loaded.png', fullPage: true });

    // Check if redirected to locale
    const currentUrl = page.url();

    if (currentUrl.includes('/en-US') || currentUrl.includes('/it-IT')) {
      console.log('✅ Redirected to locale:', currentUrl);
    } else {
      console.log('❌ Did not redirect to locale');
      console.log('Stayed at:', currentUrl);
    }

    // Check for errors
    if (errors.length > 0) {
      console.log('\n=== Page Errors ===');
      errors.forEach(err => console.log(err));
    }

    // Check console for auth errors
    const authErrors = consoleMessages.filter(msg =>
      msg.includes('auth') || msg.includes('Configuration') || msg.includes('error')
    );

    if (authErrors.length > 0) {
      console.log('\n=== Auth/Error Messages ===');
      authErrors.forEach(msg => console.log(msg));
    }

    // Pause for manual inspection
    await page.pause();
  });

  test('check page content after redirect', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Page Content Check ===');
    console.log('URL:', page.url());

    // Check for main content
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      const headingText = await h1.textContent();
      console.log('Main heading:', headingText);
    } else {
      console.log('No H1 found');
    }

    // Check for navigation
    const nav = page.locator('nav, header').first();
    if (await nav.count() > 0) {
      console.log('✅ Navigation found');
    } else {
      console.log('❌ No navigation found');
    }

    // Check for login button
    const loginButton = page.locator('a:has-text("Login"), a:has-text("Sign In")').first();
    if (await loginButton.count() > 0) {
      console.log('✅ Login button found');
      const href = await loginButton.getAttribute('href');
      console.log('Login href:', href);
    } else {
      console.log('❌ No login button');
    }

    await page.pause();
  });

  test('test login button from root URL', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    console.log('\n=== Testing Login from Root URL ===');

    // Start at root
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('1. Loaded root, redirected to:', page.url());

    // Find and click login
    const loginLink = page.locator('a:has-text("Login")').first();

    if (await loginLink.count() > 0) {
      console.log('2. Found login link');

      // Get href before clicking
      const href = await loginLink.getAttribute('href');
      console.log('3. Login href:', href);

      // Click
      await loginLink.click();
      await page.waitForTimeout(2000);

      console.log('4. After click, URL:', page.url());

      // Check for configuration error
      if (page.url().includes('/error')) {
        console.log('❌ Redirected to error page');
        const errorText = await page.locator('body').textContent();
        console.log('Error page content:', errorText?.substring(0, 200));
      } else if (page.url().includes('/signin') || page.url().includes('/auth')) {
        console.log('✅ Successfully navigated to signin page');
      } else {
        console.log('⚠️ Unknown state, URL:', page.url());
      }
    } else {
      console.log('❌ No login link found');
    }

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(err => console.log(err));
    }

    await page.pause();
  });
});

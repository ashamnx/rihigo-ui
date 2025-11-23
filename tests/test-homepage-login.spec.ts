import { test, expect } from '@playwright/test';

test.describe('Homepage Login Flow', () => {
  test('navigate from homepage to login', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      errors.push(`ERROR: ${error.message}`);
    });

    console.log('\n=== Loading Homepage ===');
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Take a screenshot
    await page.screenshot({ path: 'homepage-loaded.png', fullPage: true });

    // Look for sign in / login buttons
    console.log('\n=== Looking for Login/Signin Elements ===');

    // Check for common login button patterns
    const signInButton = page.locator('a:has-text("Sign in"), a:has-text("Sign In"), a:has-text("Login"), button:has-text("Sign in"), button:has-text("Sign In"), button:has-text("Login")').first();

    if (await signInButton.count() > 0) {
      console.log('✅ Found sign in button');
      const buttonText = await signInButton.textContent();
      console.log('Button text:', buttonText);

      // Click the sign in button
      console.log('\n=== Clicking Sign In Button ===');
      await signInButton.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      console.log('Redirected to:', page.url());

      // Check if we're on the signin page
      if (page.url().includes('/signin') || page.url().includes('/auth')) {
        console.log('✅ Successfully navigated to signin page');

        // Take screenshot of signin page
        await page.screenshot({ path: 'signin-page-from-homepage.png', fullPage: true });

        // Check for Google signin button
        const googleButton = page.locator('button:has-text("Continue with Google")').first();
        if (await googleButton.count() > 0) {
          console.log('✅ Google signin button found');
        }
      } else {
        console.log('❌ Did not navigate to signin page');
      }
    } else {
      console.log('❌ No sign in button found on homepage');

      // List all links on the page
      const allLinks = await page.locator('a').all();
      console.log('\n=== All Links on Homepage ===');
      for (const link of allLinks.slice(0, 20)) {  // First 20 links
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text?.trim()) {
          console.log(`- "${text.trim()}" -> ${href}`);
        }
      }
    }

    // Check for errors
    console.log('\n=== Errors ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No errors detected');
    }

    // Pause for manual inspection
    await page.pause();
  });

  test('check header navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Header Navigation ===');

    // Check for header/navbar
    const header = page.locator('header, nav, .navbar, [role="navigation"]').first();

    if (await header.count() > 0) {
      console.log('✅ Found header/navigation');

      // Get all navigation links
      const navLinks = await header.locator('a').all();
      console.log(`Found ${navLinks.length} navigation links:`);

      for (const link of navLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`- "${text?.trim()}" -> ${href}`);
      }
    } else {
      console.log('❌ No header/navigation found');
    }

    await page.pause();
  });

  test('attempt google signin from homepage flow', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n=== Complete Login Flow Test ===');

    // Start at homepage
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');
    console.log('1. Loaded homepage');

    // Find and click sign in
    const signInLink = page.locator('a[href*="signin"], a[href*="auth"]').first();

    if (await signInLink.count() > 0) {
      console.log('2. Found signin link, clicking...');
      await signInLink.click();
      await page.waitForLoadState('networkidle');
      console.log('3. Navigated to:', page.url());

      // Try to click Google signin
      const googleButton = page.locator('button:has-text("Continue with Google")').first();

      if (await googleButton.count() > 0) {
        console.log('4. Found Google button, clicking...');
        await googleButton.click();
        await page.waitForTimeout(2000);

        // Check for errors
        const cryptoErrors = consoleErrors.filter(err => err.includes('crypto'));
        if (cryptoErrors.length > 0) {
          console.log('❌ Crypto errors detected:');
          cryptoErrors.forEach(err => console.log(err));
        } else {
          console.log('✅ No crypto errors!');
        }

        console.log('5. Final URL:', page.url());
      }
    } else {
      console.log('❌ Could not find signin link on homepage');
    }

    await page.pause();
  });
});

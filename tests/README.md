# Playwright E2E Testing

This directory contains end-to-end tests for the Rihigo UI using Playwright.

## Setup

Playwright is already installed and configured. The browsers are installed in your system cache.

## Running Tests

```bash
# Run all tests
npm run test.e2e

# Run tests in headed mode (with browser UI)
npm run test.e2e:headed

# Run tests with Playwright UI (interactive mode)
npm run test.e2e:ui

# Debug tests
npm run test.e2e:debug

# View test report
npm run test.e2e:report
```

## Configuration

The Playwright configuration is located in `playwright.config.ts` at the root of the UI project.

### Key Settings:
- **Base URL**: http://localhost:5173
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start dev server**: Yes (runs `npm run dev` automatically)
- **Retries on CI**: 2
- **Parallel execution**: Yes (except on CI)

## Writing Tests

Tests are located in the `tests/` directory. Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Rihigo/);
  });
});
```

## MCP Integration

The Playwright MCP server is configured for Claude Code, allowing AI-powered browser automation:

```bash
# The MCP server is available as a tool in Claude Code
# You can ask Claude to interact with the browser using natural language
```

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for elements** before interacting with them
3. **Use page objects** for complex page interactions
4. **Keep tests isolated** - each test should be independent
5. **Use appropriate timeouts** - default is 30s per action

## Debugging

- Use `--headed` to see the browser
- Use `--debug` to step through tests
- Add `await page.pause()` in tests for manual inspection
- Check the HTML report with `npm run test.e2e:report`

## CI/CD

Tests are configured to run in CI with:
- Headless mode
- 2 retries on failure
- Single worker (sequential)
- Automatic dev server startup

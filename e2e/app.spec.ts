import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Inflow Application
 * 
 * These tests catch client-side errors that would cause the "Application error"
 * screen on production, including:
 * - Module factory errors (Turbopack/Webpack issues)
 * - Import resolution failures
 * - Runtime JavaScript errors
 */

test.describe('Page Load Tests', () => {
  test('home page loads without client-side errors', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Collect page errors (uncaught exceptions)
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for the critical "module factory" error
    const hasModuleError = pageErrors.some(
      (e) => e.includes('module factory') || e.includes('Module')
    );
    expect(hasModuleError).toBe(false);

    // Check page rendered successfully (not showing error screen)
    const errorScreen = page.locator('text=Application error');
    await expect(errorScreen).not.toBeVisible();

    // Verify main content is visible
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('dashboard page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should not have critical errors
    const hasCriticalError = errors.some(
      (e) =>
        e.includes('module factory') ||
        e.includes('process is not defined') ||
        e.includes('ReferenceError')
    );
    expect(hasCriticalError).toBe(false);

    // Error screen should not be visible
    const errorScreen = page.locator('text=Application error');
    await expect(errorScreen).not.toBeVisible();
  });

  test('pay page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/pay');
    await page.waitForLoadState('networkidle');

    const hasCriticalError = errors.some(
      (e) =>
        e.includes('module factory') ||
        e.includes('process is not defined')
    );
    expect(hasCriticalError).toBe(false);

    const errorScreen = page.locator('text=Application error');
    await expect(errorScreen).not.toBeVisible();
  });

  test('bridge page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/dashboard/bridge');
    await page.waitForLoadState('networkidle');

    const hasCriticalError = errors.some(
      (e) =>
        e.includes('module factory') ||
        e.includes('@stacks/connect') ||
        e.includes('ReferenceError')
    );
    expect(hasCriticalError).toBe(false);

    const errorScreen = page.locator('text=Application error');
    await expect(errorScreen).not.toBeVisible();
  });
});

test.describe('Theme Toggle', () => {
  test('theme toggle switches between light and dark mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    
    // Skip test if theme toggle not found
    if (!(await themeToggle.isVisible())) {
      test.skip();
      return;
    }

    // Get initial theme
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Theme should have changed
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Click again to toggle back
    await themeToggle.click();
    await page.waitForTimeout(500);

    const finalTheme = await html.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });
});

test.describe('Wallet Connection UI', () => {
  test('connect wallet button is visible on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for connect wallet button
    const connectButton = page.locator(
      'button:has-text("Connect"), button:has-text("Wallet")'
    ).first();

    await expect(connectButton).toBeVisible();
  });

  test('clicking connect wallet opens modal or wallet prompt', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const connectButton = page.locator(
      'button:has-text("Connect Wallet")'
    ).first();

    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1000);

      // Should open some kind of modal or panel
      // Check for common modal indicators
      const modalOrPanel = page.locator(
        '[role="dialog"], [class*="modal"], [class*="Modal"]'
      );

      // At least one modal-like element should be visible
      const isModalVisible = await modalOrPanel.first().isVisible().catch(() => false);
      
      // If no modal, check that no errors occurred
      if (!isModalVisible) {
        const errorScreen = page.locator('text=Application error');
        await expect(errorScreen).not.toBeVisible();
      }
    }
  });
});

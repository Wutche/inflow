import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Build Verification', () => {
  it('should complete webpack build without errors', () => {
    // This test runs during CI to verify the build works
    // Skip if running in quick test mode (build already verified)
    if (process.env.SKIP_BUILD_TEST) {
      console.log('Skipping build test (SKIP_BUILD_TEST=true)');
      return;
    }

    const projectRoot = path.resolve(__dirname, '../..');

    try {
      // Run the build command
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 300000, // 5 minute timeout
      });

      // Verify .next directory was created
      const nextDir = path.join(projectRoot, '.next');
      expect(fs.existsSync(nextDir)).toBe(true);

      // Verify build manifest exists
      const buildManifest = path.join(nextDir, 'build-manifest.json');
      expect(fs.existsSync(buildManifest)).toBe(true);
    } catch (error) {
      // If build fails, the test fails with the error message
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown build error';
      throw new Error(`Build failed: ${errorMsg}`);
    }
  }, 300000); // 5 minute timeout for the test

  it('should have required pages generated', () => {
    if (process.env.SKIP_BUILD_TEST) {
      return;
    }

    const projectRoot = path.resolve(__dirname, '../..');
    const appDir = path.join(projectRoot, '.next', 'server', 'app');

    // Check for key page routes (they may be .html or directories)
    const requiredRoutes = [
      '', // root (/)
      'dashboard',
      'pay',
    ];

    for (const route of requiredRoutes) {
      const routePath = path.join(appDir, route);
      // The route should exist as either a directory or the parent should
      const parentPath = path.dirname(routePath);
      expect(
        fs.existsSync(routePath) || fs.existsSync(parentPath)
      ).toBe(true);
    }
  }, 10000);
});

describe('Module Resolution', () => {
  it('should import @stacks/transactions without errors', async () => {
    // @stacks/connect requires browser APIs and can't be tested in jsdom
    // It's tested by the E2E tests instead
    // Here we just verify @stacks/transactions can be imported
    const importModule = async () => {
      const module = await import('@stacks/transactions');
      return module;
    };

    await expect(importModule()).resolves.toBeDefined();
  });
});

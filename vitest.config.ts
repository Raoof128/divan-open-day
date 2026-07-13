import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    // Playwright end-to-end specs run via `pnpm test:e2e`, not vitest.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    // Ops and release tests spawn real builds and shell scripts (execFileSync);
    // the default 5s ceiling flakes under concurrent CPU load, so allow headroom.
    // Fast tests are unaffected — they still complete in milliseconds.
    testTimeout: 30000,
    hookTimeout: 30000,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});

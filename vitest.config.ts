import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/index.ts',
      ],
      thresholds: {
        'src/router.ts': {
          lines: 95,
          branches: 95,
          functions: 95,
          statements: 95,
        },
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});

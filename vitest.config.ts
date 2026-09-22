import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/utils/**'],
      exclude: ['**/__tests__/**', '**/*.d.ts'],
    },
  },
});
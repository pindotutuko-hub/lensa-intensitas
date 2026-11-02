import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Jalur relatif agar hasil build bisa di-host di subfolder (mis. GitHub Pages).
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

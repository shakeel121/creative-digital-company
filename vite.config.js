import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        'design-guidelines': resolve(root, 'design-guidelines.html'),
        examples: resolve(root, 'examples.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});

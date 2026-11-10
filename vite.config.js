import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        classic: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game.html'),
      },
    },
  },
});

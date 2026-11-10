import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        classic: resolve(root, 'index.html'),
        game: resolve(root, 'game.html'),
      },
    },
  },
});

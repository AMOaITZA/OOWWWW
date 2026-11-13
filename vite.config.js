import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));

// Los assets tradicionales y los del juego se usan en rutas JSON y JS clásicos:
// Vite no los reconoce necesariamente como imports, por eso se copian íntegros.
function preserveStaticAssets() {
  return {
    name: 'oowwww-preserve-static',
    apply: 'build',
    closeBundle() {
      const output = resolve(root, 'dist');
      for (const folder of ['assets', 'js']) {
        const src = resolve(root, folder);
        if (!existsSync(src)) continue;
        const dest = resolve(output, folder);
        mkdirSync(dest, { recursive: true });
        cpSync(src, dest, { recursive: true, force: true });
      }
    },
  };
}
export default defineConfig({
  base: '/',
  plugins: [preserveStaticAssets()],
  build: {
    rollupOptions: {
      input: {
        classic: resolve(root, 'index.html'),
        game: resolve(root, 'game.html'),
      },
    },
  },
});

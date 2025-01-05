import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist-electron',
    lib: {
      entry: [
        resolve(__dirname, 'electron/main.ts'),
        resolve(__dirname, 'electron/preload.ts'),
      ],
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: false,
  },
});

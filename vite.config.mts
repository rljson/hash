import { resolve } from 'path';
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ include: ['src/*'] })],

  build: {
    copyPublicDir: false,
    minify: false,
    sourcemap: 'inline',

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['js-base64', '@aws-crypto/sha256-js', '@rljson/json'],
      output: {
        globals: {},
      },
    },
  },
});

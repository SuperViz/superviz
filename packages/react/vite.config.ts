import path from 'node:path';
import url from 'node:url';

import react from '@vitejs/plugin-react-swc';
import { glob } from 'glob';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';

import { peerDependencies } from './package.json';
import replace from '@rollup/plugin-replace';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.spec.ts', '**/*.spec.tsx', 'src/main.tsx', 'src/demo.tsx'],
    }),
    replace({
      'Object.defineProperty(exports, "__esModule", { value: true });':
        'Object.defineProperty(exports || {}, "__esModule", { value: true });',
      delimiters: ['\n', '\n'],
      preventAssignment: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve('src', 'index.ts'),
      name: 'superviz-sdk-react',
      formats: ['es', 'cjs'],
      fileName: (format) => `superviz-sdk-react.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(peerDependencies)],
      input: Object.fromEntries(
        glob
          .sync('src/**/*.{ts,tsx}')
          .map((file) => [
            path.relative('src', file.slice(0, file.length - path.extname(file).length)),
            url.fileURLToPath(new URL(file, import.meta.url)),
          ]),
      ),
    },
  },
});

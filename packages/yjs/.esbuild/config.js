const config = {
  loader: {
    '.png': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.eot': 'file',
    '.ttf': 'file',
  },
  bundle: true,
  color: true,
  minify: false,
  logLevel: 'info',
  chunkNames: 'chunks/[name]-[hash]',
  external: ['yjs'],
};

export const esmConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  splitting: true,
  target: 'es6',
  format: 'esm',
};

export const cjsConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node16'],
};

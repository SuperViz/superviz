const config = {
  bundle: true,
  color: true,
  minify: true,
  logLevel: 'info',
  sourcemap: true,
  chunkNames: 'chunks/[name]-[hash]',
};

const esmConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  sourcemap: true,
  minify: true,
  splitting: true,
  format: 'esm',
  define: { global: 'window' },
  target: ['esnext'],
  chunkNames: 'chunks/[name]-[hash]',
};

const cjsConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  sourcemap: true,
  minify: true,
  platform: 'node',
  target: ['node16'],
};

module.exports = {
  esmConfig,
  cjsConfig,
};

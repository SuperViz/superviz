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
  minify: true,
  logLevel: 'info',
  chunkNames: 'chunks/[name]-[hash]',
};

const esmConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  splitting: true,
  target: 'es6',
  format: 'esm',
};

const cjsConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: ['node16'],
};

module.exports = {
  esmConfig,
  cjsConfig,
};

const baseConfig = require('./config');

const esbuild = require('esbuild');

Promise.all([
  esbuild.build({
    ...baseConfig,
    outdir: 'dist/browser',
  }),
  esbuild.build({
    ...baseConfig,
    outdir: 'dist/node',
    platform: 'node',
  }),
]);

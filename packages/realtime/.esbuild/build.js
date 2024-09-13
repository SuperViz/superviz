const { cjsConfig, esmConfig } = require('./config');
const esbuild = require('esbuild');

(async () => {
  try {
    await Promise.all([
      esbuild.build({
        ...cjsConfig,
        outfile: 'dist/browser/index.cjs.js',
      }),

      esbuild.build({
        ...esmConfig,
        outdir: 'dist/browser',
      }),

      esbuild.build({
        ...cjsConfig,
        outfile: 'dist/node/index.cjs.js',
        platform: 'node',
      }),

      esbuild.build({
        ...esmConfig,
        outdir: 'dist/node',
        platform: 'node',
      }),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

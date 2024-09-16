const { cjsConfig, esmConfig } = require('./config');
const esbuild = require('esbuild');

(async () => {
  try {
    await Promise.all([
      esbuild.build({
        ...cjsConfig,
        outfile: 'dist/index.cjs.js',
      }),

      esbuild.build({
        ...esmConfig,
        outdir: 'dist',
      }),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

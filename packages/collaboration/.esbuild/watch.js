const { cjsConfig, esmConfig } = require('./config');
const esbuild = require('esbuild');

(async () => {
  try {
    const [cjsContext, esmContext] = await Promise.all([
      esbuild.context({
        ...cjsConfig,
        outfile: 'dist/index.cjs.js',
      }),

      esbuild.context({
        ...esmConfig,
        outdir: 'dist',
      }),
    ]);

    cjsContext.watch();
    esmContext.watch();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

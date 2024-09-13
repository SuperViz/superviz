const { cjsConfig, esmConfig } = require('./config');
const esbuild = require('esbuild');

(async () => {
  try {
    const [cjsContext, esmContext, nodeCjsContext, nodeEsmContext] = await Promise.all([
      esbuild.context({
        ...cjsConfig,
        outfile: 'dist/browser/index.cjs.js',
      }),

      esbuild.context({
        ...esmConfig,
        outdir: 'dist/browser',
      }),

      esbuild.context({
        ...cjsConfig,
        outfile: 'dist/node/index.cjs.js',
        platform: 'node',
      }),

      esbuild.context({
        ...esmConfig,
        outdir: 'dist/node',
        platform: 'node',
      }),
    ]);

    cjsContext.watch();
    esmContext.watch();
    nodeCjsContext.watch();
    nodeEsmContext.watch();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

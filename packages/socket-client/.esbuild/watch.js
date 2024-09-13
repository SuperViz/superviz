const baseConfig = require('./config');
const esbuild = require('esbuild');

(async () => {
  try {
    const [nodeContext, browserContext] = await Promise.all([
      esbuild.context({
        ...baseConfig,
        outdir: 'dist/node',
        platform: 'node',
      }),
      esbuild.context({
        ...baseConfig, 
        outdir: 'dist/browser',
      })
    ]);

    nodeContext.watch();
    browserContext.watch();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

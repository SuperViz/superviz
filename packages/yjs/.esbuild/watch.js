import { cjsConfig, esmConfig } from "./config.js";
import esbuild from "esbuild";

(async () => {
  try {
    const cjs = await esbuild.context({
      ...cjsConfig,
      outfile: "dist/index.cjs.js",
    });

    const esm = await esbuild.context({
      ...esmConfig,
      outdir: "dist",
    });

    cjs.watch();
    esm.watch();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

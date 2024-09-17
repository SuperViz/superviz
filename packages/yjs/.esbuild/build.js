import { cjsConfig, esmConfig } from "./config.js";
import esbuild from "esbuild";

(async () => {
  try {
    await Promise.all([
      esbuild.build({
        ...cjsConfig,
        outfile: "dist/index.cjs.js",
      }),
      esbuild.build({
        ...esmConfig,
        outdir: "dist",
      }),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

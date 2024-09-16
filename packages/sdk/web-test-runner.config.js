const { esbuildPlugin } = require('@web/dev-server-esbuild');
const { importMapsPlugin } = require('@web/dev-server-import-maps');
const { legacyPlugin } = require('@web/dev-server-legacy');
const { playwrightLauncher } = require('@web/test-runner-playwright');

module.exports = {
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
  ],
  files: [
    './src/web-components/**/*.test.ts',
    './src/web-components/**/*.spec.ts',
    '!**/node_modules/**/*',
  ],
  plugins: [
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            lodash: '/node_modules/lodash-es/lodash.js',
          },
        },
      },
    }),
    esbuildPlugin({
      ts: true,
      tsx: true,
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    }),
    legacyPlugin({
      polyfills: {
        webcomponents: true,
        // Inject lit's polyfill-support module into test files, which is required
        // for interfacing with the webcomponents polyfills
        custom: [
          {
            name: 'lit-polyfill-support',
            path: 'node_modules/lit/polyfill-support.js',
            test: "!('attachShadow' in Element.prototype)",
            module: false,
          },
        ],
      },
    }),
  ],
  coverageConfig: {
    report: true,
    reportDir: 'coverage-components',
    threshold: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
    include: ['src/web-components/**/*.ts'],
  },
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <style id="superviz-style">@import"https://unpkg.com/@superviz/sv-icons@0.8.7/css/style.css";</style>
        <script type="module" src="${testFramework}"></script>
        <script type="module">import 'jest-browser-globals';</script>
      </head>
    </html>
  `,
};

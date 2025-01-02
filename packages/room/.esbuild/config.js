require('dotenv').config();
const { style } = require('./plugins/style-loader');

const entries = Object.entries(process.env).filter((key) => key[0].startsWith('SDK_'));
const env = Object.fromEntries(entries);

const config = {
  loader: {
    '.png': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.eot': 'file',
    '.ttf': 'file',
  },
  plugins: [style()],
  bundle: true,
  color: true,
  minify: true,
  logLevel: 'info',
  sourcemap: true,
  chunkNames: 'chunks/[name]-[hash]',
  define: {
    'process.env': JSON.stringify(env),
  },
};

const esmConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  splitting: true,
  target: 'es6',
  format: 'esm',
  define: { global: 'window', 'process.env': JSON.stringify(env) },
};

const cjsConfig = {
  ...config,
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  platform: 'node',
  target: ['node16'],
};

module.exports = {
  esmConfig,
  cjsConfig,
};

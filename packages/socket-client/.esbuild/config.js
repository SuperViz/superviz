require('dotenv').config();

const entries = Object.entries(process.env).filter((key) => key[0].startsWith('SDK_'));
const env = Object.fromEntries(entries);

module.exports = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  target: 'es6',
  format: 'esm',
  define: {
    'process.env': JSON.stringify(env),
  },
  splitting: true,
  bundle: true,
  minify: true,
};

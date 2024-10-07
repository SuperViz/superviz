const fs = require('fs');
const { exec } = require('child_process');

const createFile = (version) => {
  return new Promise((resolve, reject) => {
    const filename = '.version.js';
    const content = `export const version = '${version}'`;
    
    fs.writeFile(filename, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const build = () => {
  return new Promise((resolve, reject) => {
    exec('pnpm turbo run build && ls -la ./dist', (err, stdout, stderr) => {
      if (err) {
        console.error('build package error: ', err);
        reject(err);
        return;
      }

      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      resolve();
    });
  });
}

const handle = async (context) => {
  const version = context?.nextRelease?.version;
  if (!version) {
    throw new Error('Could not determine the version from semantic release.')
  }

  await createFile(version);
  await build();
};

async function prepare(pluginConfig, context) {
  await handle(context);
}

module.exports = { prepare };
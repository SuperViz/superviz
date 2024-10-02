const fs = require('fs');
const exec = require('child_process')

const createFile = (version) => {
  const filename = '.version.js';
  const content = `export const version = '${version}'`;
  fs.writeFileSync(filename, content);
  
  console.log('Current folder:', process.cwd());
}

const build = () => {
  exec('pnpm run build', (err, stdout, stderr) => {
    if (err) {
        console.error('build package error: ', err);
        return;
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

const handle = async (context) => {
  const version = context?.nextRelease?.version;
  if (!version) {
      throw new Error('Could not determine the version from semantic release.')
  }

  createFile(version);
  build()
};

async function prepare(pluginConfig, context) {
  await handle(context);
}

module.exports = { prepare };
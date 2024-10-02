const fs = require('fs');

const createFile = (version) => {
  const filename = '.version.js';
  const content = `export const version = '${version}'`;
  fs.writeFileSync(filename, content);

}

const handle = async (context) => {
  const version = context?.nextRelease?.version;
  if (!version) {
      throw new Error('Could not determine the version from semantic release.')
  }

  createFile(version);
};

async function prepare(pluginConfig, context) {
  await handle(context);
}

module.exports = { prepare };
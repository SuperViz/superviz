/* eslint-disable no-undef */
const fs = require('fs');
const { MOCK_IO } = require('./__mocks__/io.mock');

(() => {
  const filename = '.remote-config.js';

  if (!fs.existsSync(filename)) {
    fs.writeFileSync(
      filename,
      JSON.stringify({
        apiUrl: 'https://localhost:3000',
        conferenceLayerUrl: 'https://localhost:8080',
      }),
    );
  }
})();


jest.mock('@superviz/socket-client', () => MOCK_IO);
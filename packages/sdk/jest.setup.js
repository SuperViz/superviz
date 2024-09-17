/* eslint-disable no-undef */
const fs = require('fs');
require('jest-canvas-mock');

const { MOCK_CONFIG } = require('./__mocks__/config.mock');
const { MOCK_IO } = require('./__mocks__/io.mock');
const config = require('./src/services/config');

config.default.setConfig(MOCK_CONFIG);

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

// Mock DOMPoint in the global scope
global.DOMPoint = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  matrixTransform(matrix) {
    // Implement the matrix transformation logic here
    // For simplicity, we're just returning the original point
    return this;
  }
};

jest.mock('@superviz/socket-client', () => MOCK_IO);

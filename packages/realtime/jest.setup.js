const { MOCK_IO } = require('./__mocks__/io.mock');

jest.mock('@superviz/socket-client', () => MOCK_IO);

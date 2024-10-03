import { MOCK_IO } from './__mocks__/io.mock';

jest.mock('@superviz/socket-client', () => MOCK_IO);

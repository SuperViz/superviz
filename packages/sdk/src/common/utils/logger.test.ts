import debug from 'debug';

import { Logger } from './logger';

jest.mock('debug');

describe('Logger', () => {
  let debugInstance: Logger;
  let mockDebug: jest.MockedFunction<debug.Debugger>;

  beforeEach(() => {
    mockDebug = jest.fn() as unknown as jest.MockedFunction<debug.Debugger>;
    (debug as jest.MockedFunction<typeof debug>).mockReturnValue(mockDebug);
    debugInstance = new Logger('@superviz/sdk');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should create a new instance of Debug', () => {
    expect(debugInstance).toBeDefined();
  });

  test('should call debug with the correct scope on initialization', () => {
    expect(debug).toHaveBeenCalledWith('@superviz/sdk');
  });

  test('should call debug with the correct arguments on log', () => {
    debugInstance.log('test-message', 123, { foo: 'bar' });
    expect(mockDebug).toHaveBeenCalledWith('test-message', 123, { foo: 'bar' });
  });
});

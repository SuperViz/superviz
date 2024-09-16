import { jest } from '@jest/globals';

export const MOCK_CANVAS = {
  style: {
    cursor: '',
  },
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn().mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  }),
  getContext: jest.fn().mockImplementation(() => ({
    getTransform: jest.fn().mockReturnValue({
      inverse: jest.fn().mockReturnValue({
        e: 10,
        f: 20,
      }),
      e: 10,
      f: 20,
    }),
  })),
};

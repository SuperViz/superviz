import { jest } from '@jest/globals';

import { Observer } from '../src/common/utils';

export const MOCK_OBSERVER_HELPER: Observer = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn(),
  reset: jest.fn(),
  destroy: jest.fn(),
} as unknown as Observer;

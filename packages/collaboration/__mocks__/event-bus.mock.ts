import { jest } from '@jest/globals';

import { EventBus } from '../src/services/event-bus';

export const EVENT_BUS_MOCK = {
  observers: new Map(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn(),
  destroy: jest.fn(),
} as unknown as EventBus;

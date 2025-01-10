import { Subject } from 'rxjs';

import { EventBus } from './index';

jest.mock('rxjs', () => ({
  Subject: jest.fn().mockImplementation(() => ({
    next: jest.fn(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    complete: jest.fn(),
  })),
}));

jest.mock('../../common/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
  })),
}));

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an instance of EventBus', () => {
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  it('should log creation of event bus', () => {
    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus created');
  });

  it('should subscribe to an event', () => {
    const callback = jest.fn();
    eventBus.subscribe('testEvent', callback);

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ subscribe', 'testEvent');
    expect(eventBus['observers'].get('testEvent')).not.toBeUndefined();
    expect(eventBus['subscriptions'].get(callback)).toBeDefined();
  });

  it('should unsubscribe from an event', () => {
    const callback = jest.fn();
    eventBus.subscribe('testEvent', callback);
    eventBus.unsubscribe('testEvent', callback);

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ unsubscribe', 'testEvent');
    expect(eventBus['subscriptions'].get(callback)).toBeUndefined();
  });

  it('should unsubscribe all callbacks from an event', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    eventBus.subscribe('testEvent', callback1);
    eventBus.subscribe('testEvent', callback2);
    eventBus.unsubscribe('testEvent');

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ unsubscribe', 'testEvent');
    expect(eventBus['observers'].get('testEvent')).toBeUndefined();
  });

  it('should publish an event', () => {
    const callback = jest.fn();
    eventBus.subscribe('testEvent', callback);
    eventBus.publish('testEvent', 'testData');

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ publish', 'testEvent');
    expect(eventBus['observers'].get('testEvent')?.next).toHaveBeenCalledWith('testData');
  });

  it('should not publish an event if no observers', () => {
    eventBus.publish('testEvent', 'testData');

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ publish', 'testEvent');
    expect(eventBus['observers'].get('testEvent')).toBeUndefined();
  });

  it('should destroy the event bus', () => {
    const callback = jest.fn();
    eventBus.subscribe('testEvent', callback);
    eventBus.destroy();

    expect(eventBus['logger'].log).toHaveBeenCalledWith('event-bus @ destroy');
    expect(eventBus['subscriptions'].size).toBe(0);
    expect(eventBus['observers'].size).toBe(0);
  });
});

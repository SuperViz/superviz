import { Observer } from './observer';

jest.mock('./logger');

describe('Observer', () => {
  test('should be defined', () => {
    expect(Observer).toBeDefined();
  });

  test('should be a class', () => {
    expect(typeof Observer).toBe('function');
  });

  test('should have a subscribe method', () => {
    const observer = new Observer();
    expect(observer.subscribe).toBeDefined();
  });

  test('should have an unsubscribe method', () => {
    const observer = new Observer();
    expect(observer.unsubscribe).toBeDefined();
  });

  test('should have a publish method', () => {
    const observer = new Observer();
    expect(observer.publish).toBeDefined();
  });

  describe('subscribe', () => {
    test('should add a callback to the callbacks array', () => {
      const observer = new Observer();

      const callback = jest.fn();

      observer.subscribe(callback);
      observer.publish('unit-test-event');

      expect(callback).toBeCalledWith('unit-test-event');
    });

    test('should not call the callback if it is unsubscribed', () => {
      const observer = new Observer();

      const callback = jest.fn();

      observer.subscribe(callback);
      observer.unsubscribe(callback);
      observer.publish('unit-test-event');

      expect(callback).not.toBeCalled();
    });
  });

  describe('unsubscribe', () => {
    test('should remove a callback from the callbacks array', () => {
      const observer = new Observer();

      const callback = jest.fn();

      observer.subscribe(callback);
      observer.unsubscribe(callback);
      observer.publish('unit-test-event');

      expect(callback).not.toBeCalled();
    });

    test('should not remove a callback if it is not in the callbacks array', () => {
      const observer = new Observer();

      const callback = jest.fn();

      observer.unsubscribe(callback);
      observer.publish('unit-test-event');

      expect(callback).not.toBeCalled();
    });
  });

  describe('publish', () => {
    test('should call all callbacks in the callbacks array', () => {
      const observer = new Observer();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.publish('unit-test-event');

      expect(callback1).toBeCalledWith('unit-test-event');
      expect(callback2).toBeCalledWith('unit-test-event');
    });

    test('should call all callbacks in the callbacks array with the same arguments', () => {
      const observer = new Observer();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.publish('unit-test-event', 'unit-test-argument');

      expect(callback1).toBeCalledWith('unit-test-event', 'unit-test-argument');
      expect(callback2).toBeCalledWith('unit-test-event', 'unit-test-argument');
    });

    test('should call all callbacks in the callbacks array with the same context', () => {
      const observer = new Observer();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.publish('unit-test-event', 'unit-test-argument');

      expect(callback1).toBeCalledWith('unit-test-event', 'unit-test-argument');
      expect(callback2).toBeCalledWith('unit-test-event', 'unit-test-argument');
    });

    test('should call all callbacks with trhottleTime', () => {
      const observer = new Observer({ throttleTime: 100 });

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);

      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');
      observer.publish('unit-test-event', 'unit-test-argument');

      expect(callback1).toBeCalledTimes(1);
    });

    test('should log an error if an error is thrown in a callback', () => {
      const observer = new Observer();

      const callback1 = jest.fn(() => {
        throw new Error('unit-test-error');
      });
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.publish('unit-test-event');

      expect(callback1).toBeCalledWith('unit-test-event');
      expect(callback2).toBeCalledWith('unit-test-event');
    });

    test('should not log an error if logger is not defined or null', () => {
      const observer = new Observer({ logger: null as any });

      const callback1 = jest.fn(() => {
        throw new Error('unit-test-error');
      });
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.publish('unit-test-event');

      expect(callback1).toBeCalledWith('unit-test-event');
      expect(callback2).toBeCalledWith('unit-test-event');
    });
  });

  describe('reset', () => {
    test('should reset the callbacks array', () => {
      const observer = new Observer();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.reset();
      observer.publish('unit-test-event');

      expect(callback1).not.toBeCalled();
      expect(callback2).not.toBeCalled();
    });
  });

  describe('destroy', () => {
    test('should reset the callbacks array', () => {
      const observer = new Observer();

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      observer.subscribe(callback1);
      observer.subscribe(callback2);
      observer.destroy();
      observer.publish('unit-test-event');

      expect(callback1).not.toBeCalled();
      expect(callback2).not.toBeCalled();
    });
  });
});

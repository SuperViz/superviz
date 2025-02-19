import { EventBus } from '.';

describe('EventBus', () => {
  let EventBusInstance: EventBus;

  beforeEach(() => {
    jest.clearAllMocks();

    EventBusInstance = new EventBus();
  });

  test('should be defined', () => {
    expect(EventBus).toBeDefined();
  });

  test('should be subscribe to event', () => {
    const callback = jest.fn();

    EventBusInstance.subscribe('test', callback);

    expect(EventBusInstance['observers'].get('test')).toBeDefined();
  });

  test('should be unsubscribe from event', () => {
    const callback = jest.fn();

    EventBusInstance.subscribe('test', callback);
    EventBusInstance.unsubscribe('test', callback);

    expect(EventBusInstance['observers'].get('test')).not.toBeDefined();
  });

  test('should be skip unsubscribe event not exists', () => {
    const callback = jest.fn();

    EventBusInstance.unsubscribe('test', callback);

    expect(EventBusInstance['observers'].get('test')).not.toBeDefined();
  });

  test('should be publish event', () => {
    const callback = jest.fn();

    EventBusInstance.subscribe('test', callback);
    EventBusInstance.publish('test', 'test');

    expect(callback).toHaveBeenCalledWith('test');
  });

  test('should be skip publish event if event not exists', () => {
    const callback = jest.fn();

    EventBusInstance.publish('test', 'test');

    expect(callback).not.toHaveBeenCalled();
  });

  test('should remove all observers when the service is destroyed', () => {
    const callback = jest.fn();

    EventBusInstance.subscribe('test', callback);
    EventBusInstance.destroy();

    EventBusInstance['observers'].forEach((ob) => {
      expect(ob.reset).toHaveBeenCalled();
      expect(ob.destroy).toHaveBeenCalled();
    });
    expect(EventBusInstance['observers'].size).toBe(0);
  });
});

import { Logger } from '../logger';

import { Observable } from './observable';

class DummyObserverClass extends Observable {
  protected logger: Logger;

  constructor() {
    super();

    this.logger = new Logger('@superviz/realtime/dummie-observer-class');
  }
}

describe('observer class', () => {
  let DummyObserverClassInstance: DummyObserverClass;

  beforeEach(() => {
    DummyObserverClassInstance = new DummyObserverClass();
  });

  test('should subscribe to the event component with success', () => {
    const callback = jest.fn();

    expect(DummyObserverClassInstance.subscribe).toBeDefined();

    DummyObserverClassInstance.subscribe('mount', callback);

    DummyObserverClassInstance['publish']('mount', 'test');

    expect(callback).toHaveBeenCalledWith('test');
  });

  test('should unsubscribe to the event component with success', () => {
    const callback = jest.fn();

    expect(DummyObserverClassInstance.subscribe).toBeDefined();
    DummyObserverClassInstance.subscribe('mount', callback);

    DummyObserverClassInstance['publish']('mount', 'test');

    expect(callback).toHaveBeenCalledWith('test');

    DummyObserverClassInstance['observers']['mount'].unsubscribe = jest.fn();
    DummyObserverClassInstance.unsubscribe('mount', callback);

    DummyObserverClassInstance['publish']('mount', 'test');

    expect(DummyObserverClassInstance['observers']['mount'].unsubscribe).toHaveBeenCalledWith(
      callback,
    );
  });

  test('should destroy the observer when callback is not passed', () => {
    const callback = jest.fn();

    expect(DummyObserverClassInstance.subscribe).toBeDefined();
    DummyObserverClassInstance.subscribe('mount', callback);

    DummyObserverClassInstance['publish']('mount', 'test');

    expect(callback).toHaveBeenCalledWith('test');

    DummyObserverClassInstance['observers']['mount'].destroy = jest.fn();
    const spy = jest.spyOn(DummyObserverClassInstance['observers']['mount'], 'destroy');

    DummyObserverClassInstance.unsubscribe('mount');

    DummyObserverClassInstance['publish']('mount', 'test');

    expect(DummyObserverClassInstance['observers']['mount']).toBeUndefined();
    expect(spy).toBeCalled();
  });

  test('should skip unsubscribe if the event is not subscribed', () => {
    expect(DummyObserverClassInstance.subscribe).toBeDefined();

    DummyObserverClassInstance.unsubscribe('mount');
  });

  test('should skip publish if the event is not subscribed', () => {
    expect(DummyObserverClassInstance.subscribe).toBeDefined();

    DummyObserverClassInstance['publish']('mount', 'test');
  });
});

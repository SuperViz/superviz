import subject, { Subject } from './index';

describe('Subject', () => {
  let testSubject: Subject<number>;

  beforeEach(() => {
    testSubject = subject(0);
  });

  it('should initialize with the given state', () => {
    expect(testSubject.state).toBe(0);
  });

  it('should update state and notify subscribers', () => {
    const callback = jest.fn();
    testSubject.subscribe('test', callback);

    testSubject.expose().value = 1;
    expect(testSubject.state).toBe(1);
    expect(callback).toHaveBeenCalledWith(1);
  });

  it('should allow multiple subscriptions and notify all subscribers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    testSubject.subscribe('test1', callback1);
    testSubject.subscribe('test2', callback2);

    testSubject.expose().value = 2;
    expect(callback1).toHaveBeenCalledWith(2);
    expect(callback2).toHaveBeenCalledWith(2);
  });

  it('should unsubscribe correctly', () => {
    const callback = jest.fn();
    testSubject.subscribe('test', callback);

    testSubject.unsubscribe('test');
    testSubject.expose().value = 3;
    expect(callback).not.toHaveBeenCalledWith(3);
  });

  it('should reset state on destroy', () => {
    testSubject.expose().value = 4;
    expect(testSubject.state).toBe(4);

    testSubject.destroy();
    expect(testSubject.state).toBe(0);
  });

  it('should expose public methods correctly', () => {
    const publicSubject = testSubject.expose();
    expect(publicSubject.value).toBe(0);

    publicSubject.value = 5;
    expect(publicSubject.value).toBe(5);
  });
});

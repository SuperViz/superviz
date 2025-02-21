import subject, { Subject } from '.';

const testValues = {
  str1: 'string-value-1',
  str2: 'string-value-2',
  num: 0,
  obj: {
    property: 'object-value',
  },
  id: 'test-id',
};

class TestStore {
  public property = subject<string>(testValues.str1);
}

const testStore = new TestStore();
const { value } = testStore.property.expose();

describe('base subject for all stores', () => {
  let instance: Subject<string>;

  beforeEach(() => {
    instance = subject<string>(testValues.str1);
  });

  describe('should accept multiple types', () => {
    test('should instantiate a string subject', () => {
      const instance = subject<string>(testValues.str1);
      expect(instance.state).toBe(testValues.str1);
      expect(typeof instance.state).toBe('string');
    });

    test('should instantiate a number subject', () => {
      const instance = subject<number>(testValues.num);
      expect(instance.state).toBe(testValues.num);
      expect(typeof instance.state).toBe('number');
    });

    test('should instantiate an object subject', () => {
      const instance = subject<object>(testValues.obj);
      expect(instance.state).toBe(testValues.obj);
      expect(typeof instance.state).toBe('object');
    });
  });

  describe('getters & setters', () => {
    test('should get the current value', () => {
      instance = subject<string>(testValues.str1);
      expect(instance['getValue']()).toBe(testValues.str1);
    });

    test('should set a new value', () => {
      instance = subject<string>(testValues.str1);
      instance['subject'].next = jest.fn();
      instance['setValue'](testValues.str2);

      expect(instance.state).toBe(testValues.str2);
      expect(instance['subject'].next).toHaveBeenCalledWith(testValues.str2);
    });
  });

  describe('subscribe & unsubscribe', () => {
    test('should expand subscriptions list and subscribe to subject', () => {
      instance = subject<string>(testValues.str1);
      expect(instance['subscriptions'].size).toBe(0);

      const callback = jest.fn();
      instance['subject'].subscribe = jest.fn().mockImplementation(instance['subject'].subscribe);

      instance['subscribe'](testValues.id, callback);

      expect(instance['subscriptions'].size).toBe(1);
      expect(instance['subscriptions'].get(testValues.id)).toBeDefined();
      expect(instance['subject'].subscribe).toHaveBeenCalledWith(callback);
    });

    test('should unsubscribe a subscription', () => {
      instance = subject<string>(testValues.str1);

      const callback = jest.fn();
      const unsubscribe = jest.fn();

      instance['subscribe'](testValues.id, callback);
      instance['subscriptions'].get(testValues.id)![0].unsubscribe = unsubscribe;

      instance['unsubscribe'](testValues.id);

      expect(instance['subscriptions'].size).toBe(0);
      expect(instance['subscriptions'].get(testValues.id)).toBeUndefined();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    test('should unsubscribe all subscriptions', () => {
      instance = subject<string>(testValues.str1);

      const callback = jest.fn();

      instance['subscribe'](testValues.id, callback);

      instance['destroy']();

      expect(instance['subscriptions'].size).toBe(0);
      expect(instance['subscriptions'].get(testValues.id)).toBeUndefined();
      expect(instance.state).toBe(instance['firstState']);
    });
  });

  describe('expose', () => {
    test('should return an object with the public API', () => {
      instance = subject<string>(testValues.str1);

      const publicSubject = instance['expose']();

      expect(publicSubject.value).toBe(testValues.str1);
      expect(typeof publicSubject.value).toBe('string');
      expect(publicSubject.subscribe).toBeInstanceOf(Function);
      expect(publicSubject.unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('reactivity', () => {
    test('should update the value when the subject is updated', () => {});
  });
});

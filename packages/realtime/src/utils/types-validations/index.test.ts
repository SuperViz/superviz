import { isBoolean, isObject, isString } from '.';

describe('types-validations', () => {
  describe('isString', () => {
    test('should return true if value is a string', () => {
      expect(isString('')).toBe(true);
    });

    test('should return false if value is not a string', () => {
      expect(isString(1)).toBe(false);
    });
  });

  describe('isObject', () => {
    test('should return true if value is an object', () => {
      expect(isObject({})).toBe(true);
    });

    test('should return false if value is not an object', () => {
      expect(isObject('')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    test('should return true if value is a boolean', () => {
      expect(isBoolean(true)).toBe(true);
    });

    test('should return false if value is not a boolean', () => {
      expect(isBoolean('')).toBe(false);
    });
  });
});

import { generateHash } from '.';

describe('generateHash', () => {
  test('should return a string with 30 characters', () => {
    const hash = generateHash();
    expect(hash.length).toBe(30);
  });

  test('should return a string with only lowercase letters and numbers', () => {
    const hash = generateHash();
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });

  test('should return a different string every time it is called', () => {
    const hash1 = generateHash();
    const hash2 = generateHash();
    expect(hash1).not.toBe(hash2);
  });
});

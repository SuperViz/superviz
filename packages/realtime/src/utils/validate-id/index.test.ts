import { validateId } from '.';

describe('validateId', () => {
  test('returns true for valid ids', () => {
    const validIds = [
      'abc123', // Simple valid ID
      'A-Z_a-z0-9', // Valid characters
      'Àéîøü', // Valid accented characters
      '-_&@+=,(){}[]/«».|\'"#', // Special characters
      'id with spaces', // Valid with spaces
      'a'.repeat(64), // Maximum length
      'id', // Minimum length
    ];
    validIds.forEach((id) => {
      expect(validateId(id)).toBe(true);
    });
  });

  test('returns false for invalid ids due to length constraints', () => {
    const invalidIds = [
      '', // Empty string
      'a', // Less than 2 characters
      'a'.repeat(65), // More than 64 characters
    ];
    invalidIds.forEach((id) => {
      expect(validateId(id)).toBe(false);
    });
  });

  test('returns false for invalid ids due to invalid characters', () => {
    const invalidIds = [
      'abc$', // Invalid character `$`
      'abc*', // Invalid character `*`
      'hello<>world', // Invalid character `<` and `>`
      '😊', // Emoji (not in allowed pattern)
    ];
    invalidIds.forEach((id) => {
      expect(validateId(id)).toBe(false);
    });
  });
});

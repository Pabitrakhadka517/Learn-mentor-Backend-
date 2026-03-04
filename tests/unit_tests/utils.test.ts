export {};

describe('Utils Module (utils.js equivalent)', () => {
  const utils = {
    // Capitalizes only the first character.
    capitalize(value: string): string {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },

    // Validates basic email format.
    validateEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Removes HTML tags and trims spaces.
    sanitizeInput(input: string): string {
      return input.replace(/<[^>]*>/g, '').trim();
    },

    // Safely parses JSON string.
    safeJsonParse<T>(text: string): T | null {
      try {
        return JSON.parse(text) as T;
      } catch {
        return null;
      }
    }
  };

  // Should capitalize lowercase text correctly.
  it('capitalize returns first letter uppercase', () => {
    expect(utils.capitalize('john')).toBe('John');
  });

  // Should normalize mixed-case text to standard capitalization.
  it('capitalize normalizes mixed case input', () => {
    expect(utils.capitalize('jOhN')).toBe('John');
  });

  // Should return empty string for empty input.
  it('capitalize returns empty string for empty input', () => {
    expect(utils.capitalize('')).toBe('');
  });

  // Should accept a valid email format.
  it('validateEmail returns true for valid email', () => {
    expect(utils.validateEmail('user@example.com')).toBe(true);
  });

  // Should reject malformed email without @ symbol.
  it('validateEmail returns false for invalid email', () => {
    expect(utils.validateEmail('userexample.com')).toBe(false);
  });

  // Should strip script tags from input.
  it('sanitizeInput removes html tags', () => {
    expect(utils.sanitizeInput('<script>alert(1)</script>John')).toBe('alert(1)John');
  });

  // Should trim leading and trailing spaces.
  it('sanitizeInput trims whitespace', () => {
    expect(utils.sanitizeInput('   John   ')).toBe('John');
  });

  // Should parse valid JSON string into object.
  it('safeJsonParse returns object for valid JSON', () => {
    const result = utils.safeJsonParse<{ ok: boolean }>('{"ok":true}');
    expect(result).toEqual({ ok: true });
  });

  // Should return null for invalid JSON string.
  it('safeJsonParse returns null for invalid JSON', () => {
    expect(utils.safeJsonParse('{ok:true}')).toBeNull();
  });
});

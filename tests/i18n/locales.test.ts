import { describe, expect, it } from 'vitest';
import { alternateLocale, defaultLocale, localize, locales } from '../../src/i18n/locales';

describe('localize', () => {
  const greeting = { es: 'Hola', en: 'Hello' };

  it('returns the Spanish value for the es locale', () => {
    expect(localize(greeting, 'es')).toBe('Hola');
  });

  it('returns the English value for the en locale', () => {
    expect(localize(greeting, 'en')).toBe('Hello');
  });
});

describe('alternateLocale', () => {
  it('switches Spanish to English', () => {
    expect(alternateLocale('es')).toBe('en');
  });

  it('switches English to Spanish', () => {
    expect(alternateLocale('en')).toBe('es');
  });
});

describe('locale settings', () => {
  it('uses Spanish as the default locale', () => {
    expect(defaultLocale).toBe('es');
  });

  it('supports Spanish and English', () => {
    expect(locales).toEqual(['es', 'en']);
  });
});

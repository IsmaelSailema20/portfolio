export const locales = ['es', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export type Localized<Value> = Record<Locale, Value>;

export function localize<Value>(localized: Localized<Value>, locale: Locale): Value {
  return localized[locale];
}

export function alternateLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}

import { defaultLocale, type Locale } from './locales';

export function joinBasePath(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

export function homePath(base: string, locale: Locale): string {
  return joinBasePath(base, locale === defaultLocale ? '' : `${locale}/`);
}

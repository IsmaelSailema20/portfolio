import { describe, expect, it } from 'vitest';
import { homePath, joinBasePath } from '../../src/i18n/paths';

describe('joinBasePath', () => {
  it('joins a base without trailing slash and a relative path', () => {
    expect(joinBasePath('/portfolio', 'cv/cv-es.pdf')).toBe('/portfolio/cv/cv-es.pdf');
  });

  it('avoids duplicated slashes between base and path', () => {
    expect(joinBasePath('/portfolio/', '/cv/cv-es.pdf')).toBe('/portfolio/cv/cv-es.pdf');
  });

  it('collapses repeated slashes on both sides', () => {
    expect(joinBasePath('/portfolio//', '//favicon.svg')).toBe('/portfolio/favicon.svg');
  });

  it('supports a root base', () => {
    expect(joinBasePath('/', 'favicon.svg')).toBe('/favicon.svg');
  });

  it('keeps a trailing slash for an empty path', () => {
    expect(joinBasePath('/portfolio', '')).toBe('/portfolio/');
  });
});

describe('homePath', () => {
  it('serves the default locale at the base path', () => {
    expect(homePath('/portfolio', 'es')).toBe('/portfolio/');
  });

  it('prefixes other locales', () => {
    expect(homePath('/portfolio', 'en')).toBe('/portfolio/en/');
  });

  it('supports a root base', () => {
    expect(homePath('/', 'es')).toBe('/');
    expect(homePath('/', 'en')).toBe('/en/');
  });
});

import { describe, expect, it } from 'vitest';
import { formatPeriod, formatYearMonth, parseYearMonth } from '../../src/i18n/formatPeriod';

describe('parseYearMonth', () => {
  it('parses the first day of the month in UTC', () => {
    expect(parseYearMonth('2024-02').toISOString()).toBe('2024-02-01T00:00:00.000Z');
  });

  it('parses December without overflowing the year', () => {
    expect(parseYearMonth('2023-12').toISOString()).toBe('2023-12-01T00:00:00.000Z');
  });

  it('rejects a month without leading zero', () => {
    expect(() => parseYearMonth('2024-2')).toThrow('Invalid year-month value: 2024-2');
  });

  it('rejects leading characters', () => {
    expect(() => parseYearMonth('x2024-02')).toThrow('Invalid year-month value: x2024-02');
  });

  it('rejects trailing characters', () => {
    expect(() => parseYearMonth('2024-02-15')).toThrow('Invalid year-month value: 2024-02-15');
  });
});

describe('formatYearMonth', () => {
  it('formats in Spanish', () => {
    expect(formatYearMonth('2024-01', 'es')).toBe('ene 2024');
  });

  it('formats in English', () => {
    expect(formatYearMonth('2024-01', 'en')).toBe('Jan 2024');
  });
});

describe('formatPeriod', () => {
  it('joins start and end', () => {
    expect(formatPeriod('2022-06', '2024-01', 'es', 'Actualidad')).toBe('jun 2022 — ene 2024');
  });

  it('uses the present label when there is no end', () => {
    expect(formatPeriod('2024-02', undefined, 'en', 'Present')).toBe('Feb 2024 — Present');
  });
});

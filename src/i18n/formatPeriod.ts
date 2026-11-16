import type { Locale } from './locales';

const yearMonthPattern = /^(\d{4})-(\d{2})$/;

export function parseYearMonth(yearMonth: string): Date {
  const match = yearMonthPattern.exec(yearMonth);
  if (!match) {
    throw new Error(`Invalid year-month value: ${yearMonth}`);
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

export function formatYearMonth(yearMonth: string, locale: Locale): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return formatter.format(parseYearMonth(yearMonth));
}

export function formatPeriod(
  start: string,
  end: string | undefined,
  locale: Locale,
  presentLabel: string,
): string {
  const formattedEnd = end ? formatYearMonth(end, locale) : presentLabel;
  return `${formatYearMonth(start, locale)} — ${formattedEnd}`;
}

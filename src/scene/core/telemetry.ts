import type { Locale } from '../../i18n/locales';
import { clamp } from './math';

export const liftoffPosition = 0.25;

const countdownSeconds = 10;
const missionSeconds = 760;
const kilometersPerAstronomicalUnit = 149_597_870.7;
const kilometersPerLightYear = 9.4607e12;
const kilometerDisplayLimit = 0.1 * kilometersPerAstronomicalUnit;
const lightYearDisplayThreshold = 0.1 * kilometersPerLightYear;

interface DistanceKeyframe {
  position: number;
  kilometers: number;
}

const distanceKeyframes: DistanceKeyframe[] = [
  { position: liftoffPosition, kilometers: 0 },
  { position: 1.5, kilometers: 408 },
  { position: 2.5, kilometers: 384_400 },
  { position: 3.5, kilometers: 2.8 * kilometersPerAstronomicalUnit },
  { position: 4.5, kilometers: 4.2 * kilometersPerLightYear },
  { position: 6, kilometers: 26_000 * kilometersPerLightYear },
];

const unitLabels: Record<Locale, { astronomicalUnit: string; lightYear: string }> = {
  es: { astronomicalUnit: 'UA', lightYear: 'años luz' },
  en: { astronomicalUnit: 'AU', lightYear: 'light-years' },
};

export function resolveMissionSeconds(journeyPosition: number, journeyLength: number): number {
  const position = clamp(journeyPosition, 0, journeyLength);
  if (position < liftoffPosition) {
    return -Math.ceil(((liftoffPosition - position) / liftoffPosition) * countdownSeconds);
  }
  const flightFraction = (position - liftoffPosition) / (journeyLength - liftoffPosition);
  return Math.floor(flightFraction * missionSeconds);
}

export function formatMissionClock(seconds: number): string {
  const sign = seconds < 0 ? '−' : '+';
  const absoluteSeconds = Math.abs(seconds);
  const minutes = String(Math.floor(absoluteSeconds / 60)).padStart(2, '0');
  const remainder = String(absoluteSeconds % 60).padStart(2, '0');
  return `T${sign} ${minutes}:${remainder}`;
}

export function resolveDistanceKilometers(journeyPosition: number): number {
  const firstKeyframe = distanceKeyframes[0];
  const lastKeyframe = distanceKeyframes[distanceKeyframes.length - 1];
  if (journeyPosition <= firstKeyframe.position) {
    return firstKeyframe.kilometers;
  }
  if (journeyPosition >= lastKeyframe.position) {
    return lastKeyframe.kilometers;
  }
  const nextIndex = distanceKeyframes.findIndex((keyframe) => keyframe.position > journeyPosition);
  const previous = distanceKeyframes[nextIndex - 1];
  const next = distanceKeyframes[nextIndex];
  const segmentFraction = (journeyPosition - previous.position) / (next.position - previous.position);
  const previousMagnitude = Math.log10(previous.kilometers + 1);
  const nextMagnitude = Math.log10(next.kilometers + 1);
  return 10 ** (previousMagnitude + (nextMagnitude - previousMagnitude) * segmentFraction) - 1;
}

function formatQuantity(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: value < 10 ? 1 : 0,
    useGrouping: 'always',
  }).format(value);
}

export function formatDistance(kilometers: number, locale: Locale): string {
  if (kilometers < kilometerDisplayLimit) {
    return `${formatQuantity(Math.round(kilometers), locale)} km`;
  }
  if (kilometers < lightYearDisplayThreshold) {
    const astronomicalUnits = kilometers / kilometersPerAstronomicalUnit;
    return `${formatQuantity(astronomicalUnits, locale)} ${unitLabels[locale].astronomicalUnit}`;
  }
  const lightYears = kilometers / kilometersPerLightYear;
  return `${formatQuantity(lightYears, locale)} ${unitLabels[locale].lightYear}`;
}

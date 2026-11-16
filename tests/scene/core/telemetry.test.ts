import { describe, expect, it } from 'vitest';
import {
  formatDistance,
  formatMissionClock,
  liftoffPosition,
  resolveDistanceKilometers,
  resolveMissionSeconds,
} from '../../../src/scene/core/telemetry';

const kilometersPerAstronomicalUnit = 149_597_870.7;
const kilometersPerLightYear = 9.4607e12;

describe('resolveMissionSeconds', () => {
  it('starts the countdown at ten seconds', () => {
    expect(resolveMissionSeconds(0, 5)).toBe(-10);
  });

  it('counts down until liftoff', () => {
    expect(resolveMissionSeconds(0.125, 5)).toBe(-5);
    expect(resolveMissionSeconds(0.24, 5)).toBe(-1);
  });

  it('reaches zero at liftoff', () => {
    expect(liftoffPosition).toBe(0.25);
    expect(resolveMissionSeconds(0.25, 5)).toBe(0);
  });

  it('counts up during the flight', () => {
    expect(resolveMissionSeconds(2.625, 5)).toBe(380);
  });

  it('ends at the mission duration', () => {
    expect(resolveMissionSeconds(5, 5)).toBe(760);
  });

  it('ignores positions outside the journey', () => {
    expect(resolveMissionSeconds(-1, 5)).toBe(-10);
    expect(resolveMissionSeconds(9, 5)).toBe(760);
  });
});

describe('formatMissionClock', () => {
  it('formats the countdown', () => {
    expect(formatMissionClock(-10)).toBe('T− 00:10');
    expect(formatMissionClock(-5)).toBe('T− 00:05');
  });

  it('formats liftoff as elapsed time', () => {
    expect(formatMissionClock(0)).toBe('T+ 00:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatMissionClock(75)).toBe('T+ 01:15');
    expect(formatMissionClock(760)).toBe('T+ 12:40');
  });
});

describe('resolveDistanceKilometers', () => {
  it('stays on the ground until liftoff', () => {
    expect(resolveDistanceKilometers(0)).toBe(0);
    expect(resolveDistanceKilometers(0.25)).toBe(0);
  });

  it('reaches orbit altitude at the station', () => {
    expect(resolveDistanceKilometers(1.5)).toBeCloseTo(408, 6);
  });

  it('interpolates on a logarithmic scale', () => {
    expect(resolveDistanceKilometers(0.875)).toBeCloseTo(Math.sqrt(409) - 1, 6);
  });

  it('reaches the asteroid belt and the nearest star', () => {
    expect(resolveDistanceKilometers(2.5) / kilometersPerAstronomicalUnit).toBeCloseTo(2.8, 6);
    expect(resolveDistanceKilometers(3.5) / kilometersPerLightYear).toBeCloseTo(4.2, 6);
  });

  it('ends at the wormhole distance', () => {
    expect(resolveDistanceKilometers(5)).toBe(26_000 * kilometersPerLightYear);
    expect(resolveDistanceKilometers(6)).toBe(26_000 * kilometersPerLightYear);
  });
});

describe('formatDistance', () => {
  it('formats short distances in kilometers', () => {
    expect(formatDistance(408, 'es')).toBe('408 km');
    expect(formatDistance(407.6, 'en')).toBe('408 km');
  });

  it('groups thousands per locale', () => {
    expect(formatDistance(1234, 'es')).toBe('1.234 km');
    expect(formatDistance(12_345, 'en')).toBe('12,345 km');
    expect(formatDistance(14_000_000, 'en')).toBe('14,000,000 km');
  });

  it('switches to astronomical units at a tenth of a unit', () => {
    expect(formatDistance(0.1 * kilometersPerAstronomicalUnit, 'en')).toBe('0.1 AU');
    expect(formatDistance(2.8 * kilometersPerAstronomicalUnit, 'es')).toBe('2,8 UA');
    expect(formatDistance(2.8 * kilometersPerAstronomicalUnit, 'en')).toBe('2.8 AU');
  });

  it('drops decimals from ten units', () => {
    expect(formatDistance(12.4 * kilometersPerAstronomicalUnit, 'en')).toBe('12 AU');
    expect(formatDistance(0.09 * kilometersPerLightYear, 'en')).toBe('5,692 AU');
  });

  it('switches to light-years at a tenth of a light-year', () => {
    expect(formatDistance(0.1 * kilometersPerLightYear, 'en')).toBe('0.1 light-years');
    expect(formatDistance(4.2 * kilometersPerLightYear, 'es')).toBe('4,2 años luz');
    expect(formatDistance(26_000 * kilometersPerLightYear, 'en')).toBe('26,000 light-years');
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatMissionNumber,
  missionStorageKey,
  parseMissionNumber,
} from '../../src/interactions/mission';

describe('parseMissionNumber', () => {
  it('starts at the first mission without a stored value', () => {
    expect(parseMissionNumber(null)).toBe(1);
  });

  it('reads a stored mission', () => {
    expect(parseMissionNumber('1')).toBe(1);
    expect(parseMissionNumber('3')).toBe(3);
  });

  it('rejects values below the first mission', () => {
    expect(parseMissionNumber('0')).toBe(1);
    expect(parseMissionNumber('-2')).toBe(1);
  });

  it('rejects values that are not numbers', () => {
    expect(parseMissionNumber('abc')).toBe(1);
    expect(parseMissionNumber('')).toBe(1);
  });
});

describe('formatMissionNumber', () => {
  it('pads single digits', () => {
    expect(formatMissionNumber(1)).toBe('01');
  });

  it('keeps longer numbers', () => {
    expect(formatMissionNumber(12)).toBe('12');
    expect(formatMissionNumber(123)).toBe('123');
  });
});

describe('missionStorageKey', () => {
  it('is stable so the mission count survives deployments', () => {
    expect(missionStorageKey).toBe('portfolio-mission');
  });
});

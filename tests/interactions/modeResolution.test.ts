import { describe, expect, it } from 'vitest';
import {
  type ModeEnvironment,
  modeStorageKey,
  oppositeMode,
  parseStoredMode,
  resolveInitialMode,
} from '../../src/interactions/modeResolution';

const capableEnvironment: ModeEnvironment = {
  storedMode: null,
  prefersReducedMotion: false,
  supportsWebGL: true,
  isLowEndDevice: false,
};

describe('parseStoredMode', () => {
  it('accepts the immersive mode', () => {
    expect(parseStoredMode('immersive')).toBe('immersive');
  });

  it('accepts the classic mode', () => {
    expect(parseStoredMode('classic')).toBe('classic');
  });

  it('rejects unknown values', () => {
    expect(parseStoredMode('other')).toBeNull();
    expect(parseStoredMode(null)).toBeNull();
  });
});

describe('resolveInitialMode', () => {
  it('starts immersive on a capable device', () => {
    expect(resolveInitialMode(capableEnvironment)).toBe('immersive');
  });

  it('starts classic when motion should be reduced', () => {
    expect(resolveInitialMode({ ...capableEnvironment, prefersReducedMotion: true })).toBe('classic');
  });

  it('starts classic on low-end devices', () => {
    expect(resolveInitialMode({ ...capableEnvironment, isLowEndDevice: true })).toBe('classic');
  });

  it('respects a stored classic choice', () => {
    expect(resolveInitialMode({ ...capableEnvironment, storedMode: 'classic' })).toBe('classic');
  });

  it('prefers a stored immersive choice over reduced motion', () => {
    expect(
      resolveInitialMode({
        ...capableEnvironment,
        storedMode: 'immersive',
        prefersReducedMotion: true,
        isLowEndDevice: true,
      }),
    ).toBe('immersive');
  });

  it('forces classic without WebGL even with a stored immersive choice', () => {
    expect(
      resolveInitialMode({ ...capableEnvironment, storedMode: 'immersive', supportsWebGL: false }),
    ).toBe('classic');
  });
});

describe('oppositeMode', () => {
  it('switches immersive to classic', () => {
    expect(oppositeMode('immersive')).toBe('classic');
  });

  it('switches classic to immersive', () => {
    expect(oppositeMode('classic')).toBe('immersive');
  });
});

describe('modeStorageKey', () => {
  it('is stable so stored preferences survive deployments', () => {
    expect(modeStorageKey).toBe('portfolio-mode');
  });
});

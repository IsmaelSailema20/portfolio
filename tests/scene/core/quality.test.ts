import { describe, expect, it } from 'vitest';
import { type DeviceProfile, isLowEndDevice, resolveQuality } from '../../../src/scene/core/quality';

const desktopProfile: DeviceProfile = {
  hardwareConcurrency: 8,
  deviceMemory: 8,
  hasCoarsePointer: false,
  viewportWidth: 1440,
};

describe('isLowEndDevice', () => {
  it('accepts a capable desktop', () => {
    expect(isLowEndDevice(desktopProfile)).toBe(false);
  });

  it('flags two cores or fewer', () => {
    expect(isLowEndDevice({ ...desktopProfile, hardwareConcurrency: 2 })).toBe(true);
    expect(isLowEndDevice({ ...desktopProfile, hardwareConcurrency: 3 })).toBe(false);
  });

  it('flags two gigabytes of memory or less', () => {
    expect(isLowEndDevice({ ...desktopProfile, deviceMemory: 2 })).toBe(true);
    expect(isLowEndDevice({ ...desktopProfile, deviceMemory: 3 })).toBe(false);
  });

  it('does not flag devices that hide their hardware', () => {
    expect(
      isLowEndDevice({ ...desktopProfile, hardwareConcurrency: undefined, deviceMemory: undefined }),
    ).toBe(false);
  });
});

describe('resolveQuality', () => {
  it('uses full quality on a capable desktop', () => {
    expect(resolveQuality(desktopProfile)).toEqual({
      pixelRatioLimit: 2,
      density: 1,
      antialias: true,
    });
  });

  it('uses reduced quality on touch devices', () => {
    expect(resolveQuality({ ...desktopProfile, hasCoarsePointer: true })).toEqual({
      pixelRatioLimit: 1.5,
      density: 0.6,
      antialias: true,
    });
  });

  it('uses reduced quality below the compact viewport width', () => {
    expect(resolveQuality({ ...desktopProfile, viewportWidth: 767 }).density).toBe(0.6);
    expect(resolveQuality({ ...desktopProfile, viewportWidth: 768 }).density).toBe(1);
  });

  it('uses minimum quality on low-end devices even with a fine pointer', () => {
    expect(resolveQuality({ ...desktopProfile, deviceMemory: 1 })).toEqual({
      pixelRatioLimit: 1,
      density: 0.4,
      antialias: false,
    });
  });
});

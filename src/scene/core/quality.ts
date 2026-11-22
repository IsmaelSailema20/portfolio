export interface DeviceProfile {
  hardwareConcurrency: number | undefined;
  deviceMemory: number | undefined;
  hasCoarsePointer: boolean;
  viewportWidth: number;
}

export interface Quality {
  pixelRatioLimit: number;
  density: number;
  antialias: boolean;
}

const lowEndCoreLimit = 2;
const lowEndMemoryLimit = 2;
const compactViewportWidth = 768;

export function isLowEndDevice(profile: DeviceProfile): boolean {
  const hasFewCores =
    profile.hardwareConcurrency !== undefined && profile.hardwareConcurrency <= lowEndCoreLimit;
  const hasLittleMemory =
    profile.deviceMemory !== undefined && profile.deviceMemory <= lowEndMemoryLimit;
  return hasFewCores || hasLittleMemory;
}

export function resolveQuality(profile: DeviceProfile): Quality {
  if (isLowEndDevice(profile)) {
    return { pixelRatioLimit: 1, density: 0.4, antialias: false };
  }
  if (profile.hasCoarsePointer || profile.viewportWidth < compactViewportWidth) {
    return { pixelRatioLimit: 1.5, density: 0.6, antialias: true };
  }
  return { pixelRatioLimit: 2, density: 1, antialias: true };
}

export function readDeviceProfile(): DeviceProfile {
  const extendedNavigator = navigator as Navigator & { deviceMemory?: number };
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: extendedNavigator.deviceMemory,
    hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    viewportWidth: window.innerWidth,
  };
}

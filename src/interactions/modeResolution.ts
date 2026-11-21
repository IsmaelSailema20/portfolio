export type Mode = 'immersive' | 'classic';

export interface ModeEnvironment {
  storedMode: Mode | null;
  prefersReducedMotion: boolean;
  supportsWebGL: boolean;
  isLowEndDevice: boolean;
}

export const modeStorageKey = 'portfolio-mode';

export function parseStoredMode(value: string | null): Mode | null {
  return value === 'immersive' || value === 'classic' ? value : null;
}

export function resolveInitialMode(environment: ModeEnvironment): Mode {
  if (!environment.supportsWebGL) {
    return 'classic';
  }
  if (environment.storedMode) {
    return environment.storedMode;
  }
  if (environment.prefersReducedMotion || environment.isLowEndDevice) {
    return 'classic';
  }
  return 'immersive';
}

export function oppositeMode(mode: Mode): Mode {
  return mode === 'immersive' ? 'classic' : 'immersive';
}

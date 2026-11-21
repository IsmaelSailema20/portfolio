import { isLowEndDevice, readDeviceProfile } from '../scene/core/quality';
import type { SceneHandle } from '../scene/startScene';
import {
  type Mode,
  modeStorageKey,
  oppositeMode,
  parseStoredMode,
  resolveInitialMode,
} from './modeResolution';

export interface ModeController {
  readSceneHandle(): SceneHandle | null;
}

function supportsWebGL(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function readStoredMode(): Mode | null {
  try {
    return parseStoredMode(localStorage.getItem(modeStorageKey));
  } catch {
    return null;
  }
}

function storeMode(mode: Mode): void {
  try {
    localStorage.setItem(modeStorageKey, mode);
  } catch {
    return;
  }
}

function findCurrentSection(): HTMLElement | null {
  const viewportCenter = window.innerHeight / 2;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));
  return (
    sections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= viewportCenter && bounds.bottom > viewportCenter;
    }) ?? null
  );
}

export function initializeModeController(): ModeController {
  const root = document.documentElement;
  const toggle = document.querySelector<HTMLButtonElement>('[data-mode-toggle]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
  const canRenderScene = canvas !== null && supportsWebGL();
  let sceneHandle: SceneHandle | null = null;
  let currentMode: Mode = 'classic';

  function reflectMode(mode: Mode): void {
    currentMode = mode;
    root.dataset.mode = mode;
    toggle?.setAttribute('aria-pressed', String(mode === 'immersive'));
  }

  async function applyMode(mode: Mode): Promise<void> {
    const anchorSection = findCurrentSection();
    reflectMode(mode);
    if (window.scrollY > 0) {
      anchorSection?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    if (mode === 'classic' || !canvas) {
      sceneHandle?.dispose();
      sceneHandle = null;
      return;
    }

    try {
      const { startScene } = await import('../scene/startScene');
      if (currentMode === 'immersive' && !sceneHandle) {
        sceneHandle = startScene(canvas);
      }
    } catch {
      sceneHandle = null;
      reflectMode('classic');
    }
  }

  if (toggle) {
    toggle.disabled = !canRenderScene;
    toggle.addEventListener('click', () => {
      const nextMode = oppositeMode(currentMode);
      storeMode(nextMode);
      void applyMode(nextMode);
    });
  }

  void applyMode(
    resolveInitialMode({
      storedMode: readStoredMode(),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      supportsWebGL: canRenderScene,
      isLowEndDevice: isLowEndDevice(readDeviceProfile()),
    }),
  );

  return {
    readSceneHandle: () => sceneHandle,
  };
}

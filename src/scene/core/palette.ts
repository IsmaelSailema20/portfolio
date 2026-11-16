import { Color } from 'three';

const tokenNames = {
  void: '--color-void',
  text: '--color-text',
  accent: '--color-accent',
  interactive: '--color-interactive',
  flagYellow: '--flag-yellow',
  flagBlue: '--flag-blue',
  flagRed: '--flag-red',
  hull: '--scene-hull',
  hullDark: '--scene-hull-dark',
  rock: '--scene-rock',
  snow: '--scene-snow',
  ocean: '--scene-ocean',
  land: '--scene-land',
  skyHorizon: '--scene-sky-horizon',
  skyMiddle: '--scene-sky-middle',
  skyZenith: '--scene-sky-zenith',
  solarPanel: '--scene-solar-panel',
  wormhole: '--scene-wormhole',
} as const;

export type PaletteName = keyof typeof tokenNames;

export interface Palette {
  css: Record<PaletteName, string>;
  color(name: PaletteName): Color;
}

export function readPalette(): Palette {
  const computedStyle = getComputedStyle(document.documentElement);
  const css = {} as Record<PaletteName, string>;
  for (const name of Object.keys(tokenNames) as PaletteName[]) {
    css[name] = computedStyle.getPropertyValue(tokenNames[name]).trim() || '#ffffff';
  }
  return {
    css,
    color: (name) => new Color(css[name]),
  };
}

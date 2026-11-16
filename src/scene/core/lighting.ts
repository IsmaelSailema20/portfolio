import { DirectionalLight, Group, HemisphereLight, Vector3 } from 'three';
import type { Palette } from './palette';

export const sunDirection = new Vector3(-0.3, 0.12, -1).normalize();

export function createLighting(palette: Palette): Group {
  const lighting = new Group();

  const ambientLight = new HemisphereLight(palette.color('skyMiddle'), palette.color('void'), 1.1);

  const sunLight = new DirectionalLight(palette.color('accent'), 2.4);
  sunLight.position.copy(sunDirection).multiplyScalar(100);

  const fillLight = new DirectionalLight(palette.color('text'), 0.9);
  fillLight.position.set(0.4, 0.6, 1).multiplyScalar(100);

  lighting.add(ambientLight, sunLight, fillLight);
  return lighting;
}

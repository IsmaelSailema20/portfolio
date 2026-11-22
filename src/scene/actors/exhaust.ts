import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import { createSeededRandom } from '../core/math';
import type { Palette } from '../core/palette';
import type { Quality } from '../core/quality';
import { createGlowTexture } from '../core/textures';

export interface Exhaust {
  readonly points: Points;
  update(deltaTime: number, origin: Vector3, heading: Vector3, thrust: number): void;
}

const baseCapacity = 280;
const emissionRate = 190;
const minimumLifetime = 0.45;
const lifetimeSpread = 0.45;
const ejectionSpeed = 7;
const spread = 1.3;

export function createExhaust(palette: Palette, quality: Quality): Exhaust {
  const capacity = Math.round(baseCapacity * quality.density);
  const positions = new Float32Array(capacity * 3);
  const colors = new Float32Array(capacity * 3);
  const velocities = new Float32Array(capacity * 3);
  const ages = new Float32Array(capacity);
  const lifetimes = new Float32Array(capacity).fill(0);
  const random = createSeededRandom(7);
  const flameColor = palette.color('accent');

  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(positions, 3);
  const colorAttribute = new BufferAttribute(colors, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);

  const material = new PointsMaterial({
    size: 0.7,
    map: createGlowTexture(64),
    vertexColors: true,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;

  let nextParticle = 0;
  let pendingEmission = 0;

  function emit(origin: Vector3, heading: Vector3): void {
    const offset = nextParticle * 3;
    positions[offset] = origin.x;
    positions[offset + 1] = origin.y;
    positions[offset + 2] = origin.z;
    const speed = ejectionSpeed * (0.7 + random() * 0.6);
    velocities[offset] = -heading.x * speed + (random() - 0.5) * spread;
    velocities[offset + 1] = -heading.y * speed + (random() - 0.5) * spread;
    velocities[offset + 2] = -heading.z * speed + (random() - 0.5) * spread;
    ages[nextParticle] = 0;
    lifetimes[nextParticle] = minimumLifetime + random() * lifetimeSpread;
    nextParticle = (nextParticle + 1) % capacity;
  }

  return {
    points,
    update(deltaTime, origin, heading, thrust) {
      pendingEmission += thrust * emissionRate * quality.density * deltaTime;
      while (pendingEmission >= 1) {
        emit(origin, heading);
        pendingEmission -= 1;
      }

      for (let particle = 0; particle < capacity; particle += 1) {
        const offset = particle * 3;
        const lifetime = lifetimes[particle];
        if (lifetime === 0) {
          continue;
        }
        ages[particle] += deltaTime;
        const remaining = Math.max(1 - ages[particle] / lifetime, 0);
        if (remaining === 0) {
          lifetimes[particle] = 0;
        }
        positions[offset] += velocities[offset] * deltaTime;
        positions[offset + 1] += velocities[offset + 1] * deltaTime;
        positions[offset + 2] += velocities[offset + 2] * deltaTime;
        const brightness = remaining * remaining;
        colors[offset] = flameColor.r * brightness + remaining * 0.25;
        colors[offset + 1] = flameColor.g * brightness * remaining;
        colors[offset + 2] = flameColor.b * brightness * remaining;
      }

      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
    },
  };
}

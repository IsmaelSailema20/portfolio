import { BufferAttribute, BufferGeometry, Group, Points, PointsMaterial, Vector3 } from 'three';
import { createSeededRandom } from '../core/math';
import type { Quality } from '../core/quality';

export interface Starfield {
  readonly group: Group;
  update(cameraPosition: Vector3): void;
}

interface StarLayerSettings {
  count: number;
  radius: number;
  parallax: number;
  size: number;
}

const layerSettings: StarLayerSettings[] = [
  { count: 1300, radius: 900, parallax: 0.82, size: 2.2 },
  { count: 1100, radius: 1300, parallax: 0.92, size: 1.6 },
  { count: 900, radius: 1800, parallax: 0.98, size: 1.1 },
];

const innerRadiusFraction = 0.7;

function createLayer(settings: StarLayerSettings, quality: Quality, seed: number): Points {
  const random = createSeededRandom(seed);
  const count = Math.round(settings.count * quality.density);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let star = 0; star < count; star += 1) {
    const height = random() * 2 - 1;
    const azimuth = random() * Math.PI * 2;
    const ringRadius = Math.sqrt(1 - height * height);
    const distance =
      settings.radius * (innerRadiusFraction + random() * (1 - innerRadiusFraction));
    positions[star * 3] = Math.cos(azimuth) * ringRadius * distance;
    positions[star * 3 + 1] = height * distance;
    positions[star * 3 + 2] = Math.sin(azimuth) * ringRadius * distance;

    const brightness = 0.45 + random() * 0.55;
    const warmth = random();
    colors[star * 3] = brightness * (0.86 + warmth * 0.14);
    colors[star * 3 + 1] = brightness * 0.9;
    colors[star * 3 + 2] = brightness * (1 - warmth * 0.14);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  const material = new PointsMaterial({
    size: settings.size,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });

  const layer = new Points(geometry, material);
  layer.frustumCulled = false;
  layer.renderOrder = -2;
  return layer;
}

export function createStarfield(quality: Quality): Starfield {
  const group = new Group();
  const layers = layerSettings.map((settings, layerIndex) =>
    createLayer(settings, quality, 101 + layerIndex),
  );
  group.add(...layers);

  return {
    group,
    update(cameraPosition) {
      layers.forEach((layer, layerIndex) => {
        layer.position.copy(cameraPosition).multiplyScalar(layerSettings[layerIndex].parallax);
      });
    },
  };
}

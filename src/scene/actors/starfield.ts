import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  Vector3,
} from 'three';
import { createSeededRandom } from '../core/math';
import type { Palette } from '../core/palette';
import type { Quality } from '../core/quality';
import { createGlowTexture } from '../core/textures';

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
  { count: 1300, radius: 900, parallax: 0.82, size: 3.6 },
  { count: 1100, radius: 1300, parallax: 0.92, size: 2.8 },
  { count: 900, radius: 1800, parallax: 0.98, size: 2 },
  { count: 120, radius: 1500, parallax: 0.95, size: 7 },
];

const innerRadiusFraction = 0.7;
const backdropRadius = 3000;
const galacticNormal = new Vector3(0.3, 0.85, 0.42).normalize();

const backdropVertexShader = `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backdropFragmentShader = `
  uniform vec3 deepColor;
  uniform vec3 violetColor;
  uniform vec3 coolColor;
  uniform vec3 warmColor;
  uniform vec3 galacticNormal;
  varying vec3 vDirection;

  float hash(vec3 point) {
    point = fract(point * 0.3183099 + 0.1);
    point *= 17.0;
    return fract(point.x * point.y * point.z * (point.x + point.y + point.z));
  }

  float noise(vec3 point) {
    vec3 cell = floor(point);
    vec3 blend = fract(point);
    blend = blend * blend * (3.0 - 2.0 * blend);
    return mix(
      mix(
        mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), blend.x),
        blend.y
      ),
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), blend.x),
        blend.y
      ),
      blend.z
    );
  }

  float fractalNoise(vec3 point) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      total += noise(point) * amplitude;
      point *= 2.03;
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec3 direction = normalize(vDirection);
    float galacticHeight = dot(direction, galacticNormal);
    float band = exp(-pow(galacticHeight / 0.3, 2.0));
    float clouds = fractalNoise(direction * 2.2);
    float detail = fractalNoise(direction * 6.0 + 4.0);
    float warmMask = smoothstep(0.42, 0.75, fractalNoise(direction * 1.6 + 11.0));
    float dustLanes = smoothstep(0.5, 0.72, fractalNoise(direction * 5.0 + 20.0));

    float violetMask = smoothstep(0.5, 0.82, clouds);
    float coolMask = band * smoothstep(0.42, 0.85, clouds * detail * 2.0);
    float warmGlow = warmMask * smoothstep(0.55, 0.85, clouds) * smoothstep(0.3, 0.7, detail);

    vec3 color = deepColor;
    color += violetColor * violetMask * 0.3;
    color += coolColor * coolMask * 0.16;
    color += warmColor * warmGlow * 0.12;
    color += vec3(0.85, 0.86, 1.0) * band * smoothstep(0.55, 0.9, detail) * 0.04;
    color *= 1.0 - band * dustLanes * 0.6;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createBackdrop(palette: Palette): Mesh {
  const material = new ShaderMaterial({
    vertexShader: backdropVertexShader,
    fragmentShader: backdropFragmentShader,
    uniforms: {
      deepColor: { value: palette.color('void').lerp(palette.color('skyZenith'), 0.6) },
      violetColor: { value: palette.color('skyMiddle') },
      coolColor: { value: palette.color('interactive') },
      warmColor: { value: palette.color('accent') },
      galacticNormal: { value: galacticNormal },
    },
    side: BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const backdrop = new Mesh(new SphereGeometry(backdropRadius, 48, 32), material);
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -3;
  return backdrop;
}

function createLayer(
  settings: StarLayerSettings,
  quality: Quality,
  seed: number,
  starTexture: Texture,
): Points {
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
    const warmth = random() * 2 - 1;
    colors[star * 3] = brightness * (0.9 + Math.max(warmth, 0) * 0.1);
    colors[star * 3 + 1] = brightness * (0.9 - Math.abs(warmth) * 0.06);
    colors[star * 3 + 2] = brightness * (0.9 + Math.max(-warmth, 0) * 0.1);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  const material = new PointsMaterial({
    size: settings.size,
    sizeAttenuation: false,
    vertexColors: true,
    map: starTexture,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const layer = new Points(geometry, material);
  layer.frustumCulled = false;
  layer.renderOrder = -2;
  return layer;
}

export function createStarfield(quality: Quality, palette: Palette): Starfield {
  const group = new Group();
  const backdrop = createBackdrop(palette);
  const starTexture = createGlowTexture(64);
  const layers = layerSettings.map((settings, layerIndex) =>
    createLayer(settings, quality, 101 + layerIndex, starTexture),
  );
  group.add(backdrop, ...layers);

  return {
    group,
    update(cameraPosition) {
      backdrop.position.copy(cameraPosition);
      layers.forEach((layer, layerIndex) => {
        layer.position.copy(cameraPosition).multiplyScalar(layerSettings[layerIndex].parallax);
      });
    },
  };
}

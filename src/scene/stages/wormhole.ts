import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { createSeededRandom } from '../core/math';
import { defaultPanelWindow } from '../core/panelMath';
import { createGlowTexture } from '../core/textures';
import type { Stage, StageOptions } from '../core/types';

export const wormholeAnchor = new Vector3(0, 200, -500);

const throatRadius = 9;
const haloScale = 44;
const baseParticleCount = 900;
const diskInnerRadius = 11;
const diskOuterRadius = 24;
const diskThickness = 1.4;
const spiralArms = 3;

const throatVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const throatFragmentShader = `
  uniform vec3 coolColor;
  uniform vec3 warmColor;
  uniform vec3 deepColor;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 blend = fract(point);
    blend = blend * blend * (3.0 - 2.0 * blend);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
      blend.y
    );
  }

  float layeredNoise(vec2 point) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      total += noise(point) * amplitude;
      point = point * 2.03 + 17.0;
      amplitude *= 0.5;
    }
    return total;
  }

  float starLayer(vec2 point) {
    vec2 cell = floor(point);
    vec2 offset = fract(point) - 0.5;
    float presence = step(0.86, hash(cell));
    vec2 jitter = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
    float distanceToStar = length(offset - jitter * 0.6);
    return presence * smoothstep(0.09, 0.0, distanceToStar) * (0.5 + hash(cell + 1.3));
  }

  void main() {
    vec3 normal = normalize(vNormal);
    float facing = max(dot(normal, normalize(vViewDirection)), 0.0);
    float rim = sqrt(max(1.0 - facing * facing, 0.0));

    float angle = atan(normal.y, normal.x) + time * 0.05 + rim * rim * 1.6;
    float lensedRadius = pow(rim, 2.4) * 2.6;
    vec2 beyond = vec2(cos(angle), sin(angle)) * lensedRadius + vec2(time * 0.012, 0.0);

    float cloud = layeredNoise(beyond * 1.6 + 4.0);
    float veil = layeredNoise(beyond * 3.1 - time * 0.02);
    vec3 nebula = mix(deepColor, coolColor, smoothstep(0.3, 0.75, cloud));
    nebula = mix(nebula, warmColor, smoothstep(0.55, 0.9, veil) * 0.5);
    nebula *= 0.25 + cloud * 0.9;

    float stars = starLayer(beyond * 9.0) + starLayer(beyond * 21.0 + 31.0) * 0.6;
    float lensRing = pow(rim, 9.0);

    vec3 color = nebula + vec3(stars) + coolColor * lensRing * 2.2;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createWormhole({ quality, palette }: StageOptions): Stage {
  const group = new Group();
  const random = createSeededRandom(77);
  const wormholeColor = palette.color('wormhole');
  const glowTexture = createGlowTexture();

  const portal = new Group();
  portal.position.copy(wormholeAnchor);
  group.add(portal);

  const throatMaterial = new ShaderMaterial({
    vertexShader: throatVertexShader,
    fragmentShader: throatFragmentShader,
    uniforms: {
      coolColor: { value: wormholeColor },
      warmColor: { value: palette.color('accent') },
      deepColor: { value: palette.color('skyMiddle') },
      time: { value: 0 },
    },
  });
  const throat = new Mesh(new SphereGeometry(throatRadius, 64, 48), throatMaterial);

  const halo = new Sprite(
    new SpriteMaterial({
      map: glowTexture,
      color: wormholeColor,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  halo.scale.setScalar(haloScale);

  const particleCount = Math.round(baseParticleCount * quality.density);
  const positions = new Float32Array(particleCount * 3);
  for (let particle = 0; particle < particleCount; particle += 1) {
    const spread = random() * random();
    const radius = diskInnerRadius + spread * (diskOuterRadius - diskInnerRadius);
    const arm = Math.floor(random() * spiralArms);
    const angle = radius * 0.32 + (arm / spiralArms) * Math.PI * 2 + (random() - 0.5) * 0.9;
    positions[particle * 3] = Math.cos(angle) * radius;
    positions[particle * 3 + 1] = (random() - 0.5) * diskThickness;
    positions[particle * 3 + 2] = Math.sin(angle) * radius;
  }
  const diskGeometry = new BufferGeometry();
  diskGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  const disk = new Points(
    diskGeometry,
    new PointsMaterial({
      color: wormholeColor,
      size: 0.3,
      map: glowTexture,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  const diskTilt = new Group();
  diskTilt.rotation.set(0.42, 0, 0.18);
  diskTilt.add(disk);

  portal.add(halo, throat, diskTilt);

  return {
    id: 'contact',
    group,
    waypoints: [
      wormholeAnchor.clone().add(new Vector3(0, -2, 72)),
      wormholeAnchor.clone().add(new Vector3(0, 0, 32)),
    ],
    cameraOffset: new Vector3(0, 2, 13),
    focusPoint: wormholeAnchor,
    focusWeight: 0.6,
    panelWindow: { enter: defaultPanelWindow.enter, exit: null },
    update({ elapsedTime, deltaTime }) {
      throatMaterial.uniforms.time.value = elapsedTime;
      disk.rotation.y += deltaTime * 0.12;
      halo.scale.setScalar(haloScale + Math.sin(elapsedTime * 0.9) * 2);
    },
  };
}

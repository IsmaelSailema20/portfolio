import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  CircleGeometry,
  type Color,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { roughenGeometry } from '../core/geometry';
import { sunDirection } from '../core/lighting';
import { createSeededRandom, smoothstep } from '../core/math';
import type { Palette } from '../core/palette';
import { createGlowTexture } from '../core/textures';
import type { Stage, StageOptions } from '../core/types';

const skyRadius = 260;
const groundRadius = 255;
const fadeStartAltitude = 22;
const fadeEndAltitude = 62;
const sunDistance = skyRadius - 20;
const cloudCount = 6;
const mastCount = 3;
const mastRadius = 5.6;
const mastHeight = 9;
const smokePuffCount = 26;
const smokeReach = 13;

const skyVertexShader = `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 horizonColor;
  uniform vec3 middleColor;
  uniform vec3 zenithColor;
  uniform vec3 groundColor;
  uniform vec3 sunDirection;
  uniform float opacity;
  varying vec3 vDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    vec3 color = mix(horizonColor, middleColor, smoothstep(0.0, 0.2, direction.y));
    color = mix(color, zenithColor, smoothstep(0.12, 0.65, direction.y));
    color = mix(color, groundColor, 1.0 - smoothstep(-0.04, 0.0, direction.y));
    float sunGlow = pow(max(dot(direction, sunDirection), 0.0), 12.0);
    color += horizonColor * sunGlow * 0.8 * step(0.0, direction.y);
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface FadingMaterial {
  material: Material;
  strength: number;
}

interface SmokePuff {
  sprite: Sprite;
  material: SpriteMaterial;
  angle: number;
  phaseOffset: number;
  speed: number;
}

interface RangeSettings {
  peakCount: number;
  width: number;
  depth: number;
  minimumHeight: number;
  maximumHeight: number;
  seed: number;
}

function createSky(palette: Palette): Mesh<SphereGeometry, ShaderMaterial> {
  const material = new ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: {
      horizonColor: { value: palette.color('skyHorizon') },
      middleColor: { value: palette.color('skyMiddle') },
      zenithColor: { value: palette.color('skyZenith') },
      groundColor: { value: palette.color('void') },
      sunDirection: { value: sunDirection },
      opacity: { value: 1 },
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
  });
  const sky = new Mesh(new SphereGeometry(skyRadius, 32, 24), material);
  sky.renderOrder = -1;
  return sky;
}

function createTerrainMaterial(color: Color): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness: 1, flatShading: true, transparent: true });
}

function createPeak(material: Material, radius: number, height: number, seed: number): Mesh {
  const peak = new Mesh(
    roughenGeometry(new CylinderGeometry(radius * 0.12, radius, height, 11, 4), 0.13, seed),
    material,
  );
  peak.position.y = height / 2 - 0.4;
  return peak;
}

function createRange(material: Material, settings: RangeSettings): Group {
  const range = new Group();
  const random = createSeededRandom(settings.seed);
  for (let peakIndex = 0; peakIndex < settings.peakCount; peakIndex += 1) {
    const spread = (peakIndex + random() * 0.8) / settings.peakCount - 0.5;
    const height =
      settings.minimumHeight + random() * (settings.maximumHeight - settings.minimumHeight);
    const peak = createPeak(material, height * (1.3 + random() * 0.6), height, settings.seed + peakIndex);
    peak.position.x = spread * settings.width;
    peak.position.z = settings.depth + (random() - 0.5) * 14;
    range.add(peak);
  }
  return range;
}

function createChimborazo(material: Material, snowMaterial: Material): Group {
  const mountain = new Group();
  const slopes = new Mesh(roughenGeometry(new CylinderGeometry(6.5, 27, 17, 12, 4), 0.1, 3), material);
  const shoulder = new Mesh(roughenGeometry(new CylinderGeometry(3, 15, 12, 10, 3), 0.1, 8), material);
  shoulder.position.set(13, -2.5, 3);
  const summit = new Mesh(roughenGeometry(new CylinderGeometry(1.6, 7, 4.4, 12, 2), 0.08, 5), snowMaterial);
  summit.position.y = 10.6;
  const secondSummit = new Mesh(roughenGeometry(new CylinderGeometry(0.9, 3.4, 2.4, 10, 1), 0.08, 6), snowMaterial);
  secondSummit.position.set(13, 4.6, 3);
  mountain.add(slopes, shoulder, summit, secondSummit);
  mountain.position.set(-8, 8.1, -54);
  return mountain;
}

function createLaunchComplex(
  palette: Palette,
  structureMaterial: Material,
  fadingMaterials: FadingMaterial[],
): Group {
  const complex = new Group();

  const apron = new Mesh(new CircleGeometry(9, 36), structureMaterial);
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.02;

  const platform = new Mesh(new CylinderGeometry(3.2, 3.7, 0.4, 10), structureMaterial);
  platform.position.y = 0.2;
  complex.add(apron, platform);

  const legGeometry = new BoxGeometry(0.2, 7.2, 0.2);
  for (const legOffset of [-2.75, -2.15]) {
    const leg = new Mesh(legGeometry, structureMaterial);
    leg.position.set(legOffset, 4, 0);
    complex.add(leg);
  }
  const braceGeometry = new BoxGeometry(0.6, 0.06, 0.06);
  for (let braceIndex = 0; braceIndex < 7; braceIndex += 1) {
    const brace = new Mesh(braceGeometry, structureMaterial);
    brace.position.set(-2.45, 1 + braceIndex, 0);
    brace.rotation.z = braceIndex % 2 === 0 ? 0.5 : -0.5;
    complex.add(brace);
  }
  const armGeometry = new BoxGeometry(1.5, 0.12, 0.28);
  for (const armHeight of [2.5, 4.1]) {
    const arm = new Mesh(armGeometry, structureMaterial);
    arm.position.set(-1.35, armHeight, 0);
    complex.add(arm);
  }

  const tankGeometry = new CylinderGeometry(0.9, 0.9, 2.4, 12);
  for (const tankPosition of [new Vector3(6, 1.2, -3.6), new Vector3(7.9, 1.2, -2.6)]) {
    const tank = new Mesh(tankGeometry, structureMaterial);
    tank.position.copy(tankPosition);
    complex.add(tank);
  }

  const beaconMaterial = new MeshBasicMaterial({ color: palette.color('accent'), transparent: true });
  const floodlightMaterial = new SpriteMaterial({
    map: createGlowTexture(64),
    color: palette.color('accent'),
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  fadingMaterials.push(
    { material: beaconMaterial, strength: 1 },
    { material: floodlightMaterial, strength: 0.7 },
  );

  const mastGeometry = new CylinderGeometry(0.04, 0.07, mastHeight, 6);
  const beaconGeometry = new SphereGeometry(0.1, 8, 6);
  for (let mastIndex = 0; mastIndex < mastCount; mastIndex += 1) {
    const angle = (mastIndex / mastCount) * Math.PI * 2 + 0.5;
    const x = Math.cos(angle) * mastRadius;
    const z = Math.sin(angle) * mastRadius;
    const mast = new Mesh(mastGeometry, structureMaterial);
    mast.position.set(x, mastHeight / 2, z);
    const beacon = new Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(x, mastHeight + 0.1, z);
    const floodlight = new Sprite(floodlightMaterial);
    floodlight.position.set(x, 0.5, z);
    floodlight.scale.setScalar(2.4);
    complex.add(mast, beacon, floodlight);
  }

  const towerBeacon = new Mesh(beaconGeometry, beaconMaterial);
  towerBeacon.position.set(-2.45, 7.75, 0);
  complex.add(towerBeacon);

  const equatorMaterial = new MeshBasicMaterial({ color: palette.color('accent'), transparent: true });
  fadingMaterials.push({ material: equatorMaterial, strength: 0.55 });
  const equatorLine = new Mesh(new BoxGeometry(140, 0.02, 0.16), equatorMaterial);
  equatorLine.position.y = 0.04;
  complex.add(equatorLine);

  return complex;
}

export function createLaunchBase({ palette }: StageOptions): Stage {
  const group = new Group();
  const random = createSeededRandom(11);
  const fadingMaterials: FadingMaterial[] = [];
  const rockColor = palette.color('rock');
  const horizonColor = palette.color('skyHorizon');

  const terrainMaterial = createTerrainMaterial(rockColor.clone());
  const middleRangeMaterial = createTerrainMaterial(rockColor.clone().lerp(horizonColor, 0.18));
  const farRangeMaterial = createTerrainMaterial(rockColor.clone().lerp(horizonColor, 0.4));
  const snowMaterial = new MeshStandardMaterial({
    color: palette.color('snow'),
    roughness: 0.9,
    flatShading: true,
    transparent: true,
  });
  const structureMaterial = new MeshStandardMaterial({
    color: palette.color('hullDark'),
    roughness: 0.8,
    metalness: 0.2,
    flatShading: true,
    transparent: true,
  });
  for (const material of [
    terrainMaterial,
    middleRangeMaterial,
    farRangeMaterial,
    snowMaterial,
    structureMaterial,
  ]) {
    fadingMaterials.push({ material, strength: 1 });
  }

  const ground = new Mesh(new CircleGeometry(groundRadius, 48), terrainMaterial);
  ground.rotation.x = -Math.PI / 2;

  const farRange = createRange(farRangeMaterial, {
    peakCount: 11,
    width: 330,
    depth: -150,
    minimumHeight: 12,
    maximumHeight: 26,
    seed: 31,
  });
  const middleRange = createRange(middleRangeMaterial, {
    peakCount: 7,
    width: 210,
    depth: -92,
    minimumHeight: 6,
    maximumHeight: 13,
    seed: 57,
  });

  const sky = createSky(palette);
  const glowTexture = createGlowTexture();

  const sunDiscMaterial = new MeshBasicMaterial({
    color: palette.color('accent').lerp(palette.color('text'), 0.6),
    transparent: true,
    depthWrite: false,
  });
  const sunDisc = new Mesh(new CircleGeometry(9, 40), sunDiscMaterial);
  sunDisc.position.copy(sunDirection).multiplyScalar(sunDistance);
  sunDisc.lookAt(0, 0, 0);

  const sunGlowMaterial = new SpriteMaterial({
    map: glowTexture,
    color: palette.color('accent'),
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const sunGlow = new Sprite(sunGlowMaterial);
  sunGlow.position.copy(sunDisc.position);
  sunGlow.scale.setScalar(110);

  const cloudMaterial = new SpriteMaterial({
    map: glowTexture,
    color: horizonColor.clone().lerp(palette.color('text'), 0.35),
    transparent: true,
    depthWrite: false,
  });
  fadingMaterials.push(
    { material: sunDiscMaterial, strength: 1 },
    { material: sunGlowMaterial, strength: 1 },
    { material: cloudMaterial, strength: 0.32 },
  );

  const scenery = new Group();
  for (let cloudIndex = 0; cloudIndex < cloudCount; cloudIndex += 1) {
    const cloud = new Sprite(cloudMaterial);
    const azimuth = -0.9 + (cloudIndex / (cloudCount - 1)) * 1.5 + (random() - 0.5) * 0.2;
    const elevation = 0.07 + random() * 0.16;
    cloud.position
      .set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), -Math.cos(azimuth) * Math.cos(elevation))
      .multiplyScalar(sunDistance - 6);
    cloud.scale.set(70 + random() * 60, 4 + random() * 4, 1);
    scenery.add(cloud);
  }

  const smokeColor = palette.color('snow').lerp(palette.color('accent'), 0.25);
  const smokePuffs: SmokePuff[] = [];
  for (let puffIndex = 0; puffIndex < smokePuffCount; puffIndex += 1) {
    const material = new SpriteMaterial({
      map: glowTexture,
      color: smokeColor,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    const sprite = new Sprite(material);
    scenery.add(sprite);
    smokePuffs.push({
      sprite,
      material,
      angle: random() * Math.PI * 2,
      phaseOffset: random(),
      speed: 0.7 + random() * 0.6,
    });
  }

  scenery.add(
    sky,
    sunDisc,
    sunGlow,
    ground,
    farRange,
    middleRange,
    createChimborazo(terrainMaterial, snowMaterial),
    createLaunchComplex(palette, structureMaterial, fadingMaterials),
  );
  group.add(scenery);

  return {
    id: 'home',
    group,
    waypoints: [new Vector3(0, 1.95, 0), new Vector3(0, 44, -8)],
    cameraOffset: new Vector3(0, 0.6, 12),
    panelWindow: { enter: null, exit: [0.3, 0.5] },
    update({ rocketPosition, localProgress, elapsedTime }) {
      const opacity = 1 - smoothstep(fadeStartAltitude, fadeEndAltitude, rocketPosition.y);
      scenery.visible = opacity > 0;
      sky.material.uniforms.opacity.value = opacity;
      for (const fading of fadingMaterials) {
        fading.material.opacity = opacity * fading.strength;
      }

      const ignition = smoothstep(0.03, 0.12, localProgress) * (1 - smoothstep(0.45, 0.7, localProgress));
      for (const puff of smokePuffs) {
        const phase = (elapsedTime * 0.35 * puff.speed + puff.phaseOffset) % 1;
        const reach = 1.5 + phase * smokeReach;
        puff.sprite.position.set(
          Math.cos(puff.angle) * reach,
          0.6 + phase * 2,
          Math.sin(puff.angle) * reach,
        );
        puff.sprite.scale.setScalar(2.5 + phase * 8);
        puff.material.opacity = ignition * (1 - phase) * 0.55 * opacity;
      }
    },
  };
}

import {
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { dampingFactor } from '../core/math';
import type { Palette, PaletteName } from '../core/palette';
import { createEcuadorEmblemTexture } from '../core/textures';

export interface Rocket {
  readonly group: Group;
  update(position: Vector3, heading: Vector3, deltaTime: number): void;
  readTailPosition(target: Vector3): Vector3;
  readHeading(target: Vector3): Vector3;
}

const noseAxis = new Vector3(0, 1, 0);
const tailOffset = new Vector3(0, -1.55, 0);
const turnSmoothing = 4.5;
const radialSegments = 64;

const bodyRadius = 0.5;
const bodyBottom = -1;
const bodyTop = 1;
const boattailBottom = -1.18;
const boattailRadius = 0.42;
const noseLength = 1.3;
const noseSamples = 24;
const noseSharpness = 0.62;
const seamHeights = [-0.62, bodyTop];
const seamTube = 0.009;

const portholeHeight = 0.84;
const portholeRadius = 0.12;
const portholeFrameTube = 0.026;

const finCount = 4;
const finThickness = 0.05;
const finBevel = 0.016;
const finOutline: [number, number][] = [
  [0, -0.36],
  [0.46, -0.86],
  [0.46, -1.26],
  [0, -1.15],
];

const nozzleTop = -1.24;
const nozzleBottom = -1.55;
const nozzleThroatRadius = 0.16;
const nozzleExitRadius = 0.33;
const nozzleSamples = 16;

const emblemArc = 0.95;
const emblemHeight = 0.6;
const emblemCenter = 0.37;

const flagBands: { color: PaletteName; height: number; center: number }[] = [
  { color: 'flagYellow', height: 0.26, center: 0.5 },
  { color: 'flagBlue', height: 0.13, center: 0.305 },
  { color: 'flagRed', height: 0.13, center: 0.175 },
];

function createHullProfile(): Vector2[] {
  const profile = [
    new Vector2(boattailRadius, boattailBottom),
    new Vector2(bodyRadius, bodyBottom),
    new Vector2(bodyRadius, bodyTop),
  ];
  for (let sampleIndex = 1; sampleIndex <= noseSamples; sampleIndex += 1) {
    const progress = sampleIndex / noseSamples;
    const radius = bodyRadius * Math.pow(1 - progress * progress, noseSharpness);
    profile.push(new Vector2(Math.max(radius, 0.001), bodyTop + progress * noseLength));
  }
  return profile;
}

function createNozzleProfile(): Vector2[] {
  return Array.from({ length: nozzleSamples + 1 }, (_, sampleIndex) => {
    const progress = sampleIndex / nozzleSamples;
    const flare = 1 - Math.pow(1 - progress, 2);
    return new Vector2(
      nozzleThroatRadius + (nozzleExitRadius - nozzleThroatRadius) * flare,
      nozzleTop + (nozzleBottom - nozzleTop) * progress,
    );
  });
}

function createFinGeometry(): ExtrudeGeometry {
  const [firstCorner, ...remainingCorners] = finOutline;
  const shape = new Shape();
  shape.moveTo(firstCorner[0], firstCorner[1]);
  for (const [cornerX, cornerY] of remainingCorners) {
    shape.lineTo(cornerX, cornerY);
  }
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: finThickness,
    bevelEnabled: true,
    bevelThickness: finBevel,
    bevelSize: finBevel,
    bevelSegments: 3,
  });
  geometry.translate(0, 0, -finThickness / 2);
  return geometry;
}

export function createRocket(palette: Palette): Rocket {
  const group = new Group();

  const hullMaterial = new MeshPhysicalMaterial({
    color: palette.color('hull'),
    roughness: 0.32,
    metalness: 0.15,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: palette.color('hullDark'),
    roughness: 0.35,
    metalness: 0.45,
  });
  const nozzleMaterial = new MeshStandardMaterial({
    color: palette.color('hullDark').lerp(palette.color('accent'), 0.3),
    roughness: 0.28,
    metalness: 0.6,
    side: DoubleSide,
  });

  const hull = new Mesh(new LatheGeometry(createHullProfile(), radialSegments), hullMaterial);
  const noseTip = new Mesh(new SphereGeometry(0.035, 16, 12), trimMaterial);
  noseTip.position.y = bodyTop + noseLength;
  group.add(hull, noseTip);

  for (const seamHeight of seamHeights) {
    const seam = new Mesh(
      new TorusGeometry(bodyRadius + 0.002, seamTube, 6, radialSegments),
      trimMaterial,
    );
    seam.rotation.x = Math.PI / 2;
    seam.position.y = seamHeight;
    group.add(seam);
  }

  const portholeFrame = new Mesh(
    new TorusGeometry(portholeRadius, portholeFrameTube, 12, 32),
    trimMaterial,
  );
  portholeFrame.position.set(0, portholeHeight, bodyRadius + 0.004);
  const portholeGlass = new Mesh(
    new CircleGeometry(portholeRadius, 32),
    new MeshStandardMaterial({
      color: palette.color('interactive'),
      emissive: palette.color('interactive'),
      emissiveIntensity: 0.55,
      roughness: 0.08,
      metalness: 0.6,
    }),
  );
  portholeGlass.position.set(0, portholeHeight, bodyRadius + 0.006);
  group.add(portholeFrame, portholeGlass);

  for (const band of flagBands) {
    const bandMesh = new Mesh(
      new CylinderGeometry(
        bodyRadius + 0.004,
        bodyRadius + 0.004,
        band.height,
        radialSegments,
        1,
        true,
      ),
      new MeshPhysicalMaterial({
        color: palette.color(band.color),
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    );
    bandMesh.position.y = band.center;
    group.add(bandMesh);
  }

  const emblem = new Mesh(
    new CylinderGeometry(
      bodyRadius + 0.008,
      bodyRadius + 0.008,
      emblemHeight,
      24,
      1,
      true,
      -emblemArc / 2,
      emblemArc,
    ),
    new MeshStandardMaterial({
      map: createEcuadorEmblemTexture(),
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.45,
    }),
  );
  emblem.position.y = emblemCenter;
  group.add(emblem);

  const finGeometry = createFinGeometry();
  for (let finIndex = 0; finIndex < finCount; finIndex += 1) {
    const finPivot = new Group();
    finPivot.rotation.y = ((finIndex + 0.5) / finCount) * Math.PI * 2;
    const fin = new Mesh(finGeometry, trimMaterial);
    fin.position.x = bodyRadius - 0.03;
    finPivot.add(fin);
    group.add(finPivot);
  }

  const engineMount = new Mesh(
    new CylinderGeometry(
      boattailRadius,
      nozzleThroatRadius + 0.06,
      boattailBottom - nozzleTop + 0.02,
      32,
    ),
    trimMaterial,
  );
  engineMount.position.y = (boattailBottom + nozzleTop) / 2;
  const nozzle = new Mesh(new LatheGeometry(createNozzleProfile(), 48), nozzleMaterial);
  const nozzleGlow = new Mesh(
    new CircleGeometry(nozzleExitRadius * 0.92, 32),
    new MeshBasicMaterial({
      color: palette.color('accent').lerp(palette.color('text'), 0.35),
      transparent: true,
      opacity: 0.85,
    }),
  );
  nozzleGlow.rotation.x = Math.PI / 2;
  nozzleGlow.position.y = nozzleBottom + 0.04;
  group.add(engineMount, nozzle, nozzleGlow);

  const targetOrientation = new Quaternion();

  return {
    group,
    update(position, heading, deltaTime) {
      group.position.copy(position);
      targetOrientation.setFromUnitVectors(noseAxis, heading);
      group.quaternion.slerp(targetOrientation, dampingFactor(turnSmoothing, deltaTime));
    },
    readTailPosition(target) {
      return target.copy(tailOffset).applyQuaternion(group.quaternion).add(group.position);
    },
    readHeading(target) {
      return target.copy(noseAxis).applyQuaternion(group.quaternion);
    },
  };
}

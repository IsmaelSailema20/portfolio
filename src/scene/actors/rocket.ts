import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
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
const finCount = 3;
const emblemArc = 0.95;
const emblemHeight = 0.6;
const emblemCenter = 0.37;

const flagBands: { color: PaletteName; height: number; center: number }[] = [
  { color: 'flagYellow', height: 0.26, center: 0.5 },
  { color: 'flagBlue', height: 0.13, center: 0.305 },
  { color: 'flagRed', height: 0.13, center: 0.175 },
];

export function createRocket(palette: Palette): Rocket {
  const group = new Group();

  const hullMaterial = new MeshStandardMaterial({
    color: palette.color('hull'),
    roughness: 0.55,
    metalness: 0.15,
    flatShading: true,
  });
  const darkMaterial = new MeshStandardMaterial({
    color: palette.color('hullDark'),
    roughness: 0.7,
    metalness: 0.3,
    flatShading: true,
  });

  const hull = new Mesh(new CylinderGeometry(0.5, 0.5, 2.2, 14), hullMaterial);

  const nose = new Mesh(new ConeGeometry(0.5, 1.1, 14), hullMaterial);
  nose.position.y = 1.65;

  const engine = new Mesh(new CylinderGeometry(0.3, 0.44, 0.45, 12), darkMaterial);
  engine.position.y = -1.3;

  const porthole = new Mesh(
    new SphereGeometry(0.17, 12, 8),
    new MeshBasicMaterial({ color: palette.color('interactive') }),
  );
  porthole.position.set(0, 0.92, 0.42);

  group.add(hull, nose, engine, porthole);

  for (const band of flagBands) {
    const bandMesh = new Mesh(
      new CylinderGeometry(0.512, 0.512, band.height, 14),
      new MeshStandardMaterial({ color: palette.color(band.color), roughness: 0.6 }),
    );
    bandMesh.position.y = band.center;
    group.add(bandMesh);
  }

  const emblem = new Mesh(
    new CylinderGeometry(0.52, 0.52, emblemHeight, 10, 1, true, -emblemArc / 2, emblemArc),
    new MeshStandardMaterial({
      map: createEcuadorEmblemTexture(),
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.6,
    }),
  );
  emblem.position.y = emblemCenter;
  group.add(emblem);

  for (let finIndex = 0; finIndex < finCount; finIndex += 1) {
    const finPivot = new Group();
    finPivot.rotation.y = (finIndex / finCount) * Math.PI * 2;
    const fin = new Mesh(new BoxGeometry(0.07, 0.9, 0.62), darkMaterial);
    fin.position.set(0, -0.8, 0.68);
    fin.rotation.x = -0.32;
    finPivot.add(fin);
    group.add(finPivot);
  }

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

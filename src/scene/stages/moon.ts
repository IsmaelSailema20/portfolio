import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { roughenGeometry } from '../core/geometry';
import { clamp, createSeededRandom, damp, dampingFactor } from '../core/math';
import { resolveStepLocalProgress } from '../core/panelMath';
import type { Stage, StageOptions } from '../core/types';

const anchor = new Vector3(20, 122, -150);
const moonRadius = 12;
const craterCount = 18;
const craterClearance = 0.92;
const minimumOutpostTilt = 0.2;
const outpostTiltRange = 0.5;
const domeRadius = 1.1;
const annexRadius = 0.6;
const restingGlow = 0.5;
const activeGlow = 2.8;
const activeOutpostScale = 1.35;
const outpostFocusWeight = 0.6;
const worldUp = new Vector3(0, 1, 0);

interface Outpost {
  group: Group;
  direction: Vector3;
  glowMaterial: MeshStandardMaterial;
}

function randomSurfaceDirection(random: () => number): Vector3 {
  const polar = Math.acos(2 * random() - 1);
  const azimuth = random() * Math.PI * 2;
  return new Vector3(
    Math.sin(polar) * Math.cos(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.sin(azimuth),
  );
}

function pickCraterDirection(random: () => number, outposts: Outpost[]): Vector3 {
  let direction = randomSurfaceDirection(random);
  while (outposts.some((outpost) => direction.dot(outpost.direction) > craterClearance)) {
    direction = randomSurfaceDirection(random);
  }
  return direction;
}

export function createMoon({ content, palette }: StageOptions): Stage {
  const group = new Group();
  const random = createSeededRandom(7);

  const waypoints = [
    anchor.clone().add(new Vector3(2, -21, 9)),
    anchor.clone().add(new Vector3(-21, -3, 6)),
    anchor.clone().add(new Vector3(-3, 21, 4)),
    anchor.clone().add(new Vector3(21, 4, 2)),
    anchor.clone().add(new Vector3(10, 22, -12)),
  ];
  const route = new CatmullRomCurve3(waypoints);

  const surfaceMaterial = new MeshStandardMaterial({
    color: palette.color('moon'),
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  const craterMaterial = new MeshStandardMaterial({
    color: palette.color('rock'),
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });
  const hullMaterial = new MeshStandardMaterial({
    color: palette.color('hull'),
    roughness: 0.6,
    metalness: 0.25,
    flatShading: true,
  });
  const darkMaterial = new MeshStandardMaterial({
    color: palette.color('hullDark'),
    roughness: 0.7,
    metalness: 0.3,
    flatShading: true,
  });

  const moon = new Mesh(
    roughenGeometry(new IcosahedronGeometry(moonRadius, 3), 0.025, 11),
    surfaceMaterial,
  );
  moon.position.copy(anchor);
  group.add(moon);

  const domeGeometry = new SphereGeometry(domeRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const annexGeometry = new SphereGeometry(annexRadius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const ringGeometry = new TorusGeometry(domeRadius, 0.1, 6, 24);
  const tunnelGeometry = new CylinderGeometry(0.2, 0.2, 1.2, 8);
  const mastGeometry = new CylinderGeometry(0.05, 0.05, 2.4, 6);
  const outposts: Outpost[] = [];

  for (let outpostIndex = 0; outpostIndex < content.skillGroupCount; outpostIndex += 1) {
    const localProgress = resolveStepLocalProgress(outpostIndex, content.skillGroupCount);
    const routeFraction = clamp(
      (localProgress * waypoints.length - 0.5) / (waypoints.length - 1),
      0,
      1,
    );
    const direction = route.getPoint(routeFraction).sub(anchor).normalize();
    direction.z += minimumOutpostTilt + random() * outpostTiltRange;
    direction.normalize();

    const glowMaterial = new MeshStandardMaterial({
      color: palette.color('hullDark'),
      emissive: palette.color('accent'),
      emissiveIntensity: restingGlow,
    });

    const outpost = new Group();
    outpost.position.copy(anchor).addScaledVector(direction, moonRadius * 0.98);
    outpost.quaternion.setFromUnitVectors(worldUp, direction);
    outpost.rotateY(random() * Math.PI * 2);

    const dome = new Mesh(domeGeometry, hullMaterial);
    const glowRing = new Mesh(ringGeometry, glowMaterial);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.1;
    const tunnel = new Mesh(tunnelGeometry, darkMaterial);
    tunnel.rotation.z = Math.PI / 2;
    tunnel.position.set(domeRadius + 0.35, 0.2, 0);
    const annex = new Mesh(annexGeometry, hullMaterial);
    annex.position.x = domeRadius + 1.1;
    const mast = new Mesh(mastGeometry, darkMaterial);
    mast.position.set(-domeRadius * 0.6, 1.2, domeRadius * 0.6);

    outpost.add(dome, glowRing, tunnel, annex, mast);
    group.add(outpost);
    outposts.push({ group: outpost, direction, glowMaterial });
  }

  const craterGeometry = new SphereGeometry(1, 10, 6);
  for (let craterIndex = 0; craterIndex < craterCount; craterIndex += 1) {
    const direction = pickCraterDirection(random, outposts);
    const craterSize = 0.8 + random() * 1.8;
    const crater = new Mesh(craterGeometry, craterMaterial);
    crater.position.copy(anchor).addScaledVector(direction, moonRadius - craterSize * 0.12);
    crater.quaternion.setFromUnitVectors(worldUp, direction);
    crater.scale.set(craterSize, craterSize * 0.18, craterSize);
    group.add(crater);
  }

  const focusPoint = anchor.clone();
  const focusTarget = new Vector3();
  let activeOutpost = 0;

  return {
    id: 'skills',
    group,
    waypoints,
    cameraOffset: new Vector3(0, 6, 22),
    focusPoint,
    focusWeight: 0.5,
    update({ elapsedTime, deltaTime }) {
      const currentOutpost = outposts[activeOutpost];
      if (currentOutpost) {
        focusTarget.copy(currentOutpost.group.position).lerp(anchor, 1 - outpostFocusWeight);
        focusPoint.lerp(focusTarget, dampingFactor(3, deltaTime));
      }

      outposts.forEach((outpost, outpostIndex) => {
        const isActive = outpostIndex === activeOutpost;
        const breathing = Math.sin(elapsedTime * 1.4 + outpostIndex * 1.7) * 0.15;
        outpost.glowMaterial.emissiveIntensity = damp(
          outpost.glowMaterial.emissiveIntensity,
          isActive ? activeGlow : restingGlow + breathing,
          6,
          deltaTime,
        );
        outpost.group.scale.setScalar(
          damp(outpost.group.scale.x, isActive ? activeOutpostScale : 1, 6, deltaTime),
        );
      });
    },
    setStep(activeStep) {
      activeOutpost = activeStep;
    },
  };
}

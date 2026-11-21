import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import { damp, dampingFactor } from '../core/math';
import type { Stage, StageOptions } from '../core/types';
import { createEarth } from './earth';

const anchor = new Vector3(0, 72, -95);
const earthOffset = new Vector3(-50, -220, -280);
const viewerOffset = new Vector3(0, 9, 38);
const ringRadius = 5.5;
const spokeCount = 2;
const restingGlow = 0.5;
const activeGlow = 2.8;
const stowedFinScale = 0.05;
const moduleFocusWeight = 0.55;
const wheelTurnSmoothing = 2.2;
const fullTurn = Math.PI * 2;

interface StationModule {
  angle: number;
  mesh: Mesh;
  glowMaterial: MeshStandardMaterial;
  fins: Mesh[];
}

function shortestTurn(fromAngle: number, toAngle: number): number {
  const difference = (toAngle - fromAngle) % fullTurn;
  if (difference > Math.PI) {
    return difference - fullTurn;
  }
  if (difference < -Math.PI) {
    return difference + fullTurn;
  }
  return difference;
}

export function createOrbitalStation({ content, palette }: StageOptions): Stage {
  const group = new Group();

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
  const solarMaterial = new MeshStandardMaterial({
    color: palette.color('solarPanel'),
    roughness: 0.35,
    metalness: 0.6,
    flatShading: true,
  });

  const station = new Group();
  station.position.copy(anchor);
  station.rotation.set(0.35, 0, 1.15);
  station.scale.setScalar(1.35);

  const hub = new Mesh(new CylinderGeometry(1.15, 1.15, 9, 12), hullMaterial);
  station.add(hub);

  for (const side of [-1, 1]) {
    const solarArray = new Mesh(new BoxGeometry(7.5, 0.06, 2.3), solarMaterial);
    solarArray.position.y = side * 5.3;
    const mast = new Mesh(new CylinderGeometry(0.12, 0.12, 1.6, 6), darkMaterial);
    mast.position.y = side * 4.9;
    station.add(solarArray, mast);
  }

  const wheel = new Group();
  const rim = new Mesh(new TorusGeometry(ringRadius, 0.42, 8, 30), hullMaterial);
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  for (let spokeIndex = 0; spokeIndex < spokeCount; spokeIndex += 1) {
    const spoke = new Mesh(new BoxGeometry(ringRadius * 2, 0.2, 0.2), darkMaterial);
    spoke.rotation.y = (spokeIndex / spokeCount) * Math.PI;
    wheel.add(spoke);
  }

  const modules: StationModule[] = [];
  const moduleGeometry = new CylinderGeometry(0.8, 0.8, 2, 8);
  const windowGeometry = new BoxGeometry(0.16, 1.3, 0.5);
  const finGeometry = new BoxGeometry(1.9, 0.05, 0.8);

  for (let moduleIndex = 0; moduleIndex < content.aboutBlockCount; moduleIndex += 1) {
    const angle = (moduleIndex / content.aboutBlockCount) * fullTurn;
    const glowMaterial = new MeshStandardMaterial({
      color: palette.color('hullDark'),
      emissive: palette.color('accent'),
      emissiveIntensity: restingGlow,
    });
    const mesh = new Mesh(moduleGeometry, darkMaterial);
    const windowStrip = new Mesh(windowGeometry, glowMaterial);
    windowStrip.position.x = 0.78;
    mesh.add(windowStrip);

    const fins = [-1, 1].map((side) => {
      const fin = new Mesh(finGeometry, solarMaterial);
      fin.position.set(1.2, side * 1.25, 0);
      fin.scale.x = stowedFinScale;
      mesh.add(fin);
      return fin;
    });

    mesh.position.set(Math.cos(angle) * ringRadius, 0, -Math.sin(angle) * ringRadius);
    mesh.rotation.y = angle;
    wheel.add(mesh);
    modules.push({ angle, mesh, glowMaterial, fins });
  }

  station.add(wheel);
  station.updateMatrixWorld(true);

  const earth = createEarth(
    palette,
    anchor.clone().add(earthOffset),
    anchor.clone().add(viewerOffset),
  );

  group.add(station, earth.group);

  const focusPoint = anchor.clone();
  const focusTarget = new Vector3();
  const rocketInStation = new Vector3();
  let activeModule = 0;

  return {
    id: 'about',
    group,
    waypoints: [
      anchor.clone().add(new Vector3(-15, -3, 9)),
      anchor.clone().add(new Vector3(0, -1, 17)),
      anchor.clone().add(new Vector3(15, 1, 9)),
      anchor.clone().add(new Vector3(17, 3, -9)),
    ],
    cameraOffset: new Vector3(0, 10, 21),
    focusPoint,
    focusWeight: 0.5,
    update({ elapsedTime, deltaTime, rocketPosition }) {
      earth.update(elapsedTime);

      const dockedModule = modules[activeModule];
      if (dockedModule) {
        station.worldToLocal(rocketInStation.copy(rocketPosition));
        const facingAngle = Math.atan2(-rocketInStation.z, rocketInStation.x);
        wheel.rotation.y +=
          shortestTurn(wheel.rotation.y, facingAngle - dockedModule.angle) *
          dampingFactor(wheelTurnSmoothing, deltaTime);

        dockedModule.mesh.getWorldPosition(focusTarget).lerp(anchor, 1 - moduleFocusWeight);
        focusPoint.lerp(focusTarget, dampingFactor(3, deltaTime));
      }

      modules.forEach((stationModule, moduleIndex) => {
        const isActive = moduleIndex === activeModule;
        const breathing = Math.sin(elapsedTime * 1.4 + moduleIndex * 1.7) * 0.15;
        stationModule.glowMaterial.emissiveIntensity = damp(
          stationModule.glowMaterial.emissiveIntensity,
          isActive ? activeGlow : restingGlow + breathing,
          6,
          deltaTime,
        );
        stationModule.mesh.scale.setScalar(
          damp(stationModule.mesh.scale.x, isActive ? 1.3 : 1, 6, deltaTime),
        );
        for (const fin of stationModule.fins) {
          fin.scale.x = damp(fin.scale.x, isActive ? 1 : stowedFinScale, 4, deltaTime);
        }
      });
    },
    setStep(activeStep) {
      activeModule = activeStep;
    },
  };
}

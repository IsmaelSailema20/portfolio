import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import type { Palette } from '../core/palette';
import { createEarthTexture } from './earthTexture';

export interface Earth {
  readonly group: Group;
  update(elapsedTime: number): void;
}

const earthRadius = 140;
const launchSite = { longitude: -78.8, latitude: -1.47 };
const worldUp = new Vector3(0, 1, 0);
const ringNormal = new Vector3(0, 0, 1);

function geographicDirection(longitude: number, latitude: number): Vector3 {
  const azimuth = ((longitude + 180) / 360) * Math.PI * 2;
  const polar = ((90 - latitude) / 180) * Math.PI;
  return new Vector3(
    -Math.cos(azimuth) * Math.sin(polar),
    Math.cos(polar),
    Math.sin(azimuth) * Math.sin(polar),
  );
}

function projectOntoPlane(vector: Vector3, planeNormal: Vector3): Vector3 {
  return vector.clone().addScaledVector(planeNormal, -vector.dot(planeNormal)).normalize();
}

function resolveOrientation(siteDirection: Vector3, facingDirection: Vector3): Quaternion {
  const faceViewer = new Quaternion().setFromUnitVectors(siteDirection, facingDirection);
  const rotatedNorth = projectOntoPlane(worldUp.clone().applyQuaternion(faceViewer), facingDirection);
  const screenUp = projectOntoPlane(worldUp, facingDirection);
  const rollAngle = Math.atan2(
    facingDirection.dot(rotatedNorth.clone().cross(screenUp)),
    rotatedNorth.dot(screenUp),
  );
  const northUp = new Quaternion().setFromAxisAngle(facingDirection, rollAngle);
  return northUp.multiply(faceViewer);
}

export function createEarth(palette: Palette, center: Vector3, viewerPosition: Vector3): Earth {
  const group = new Group();
  group.position.copy(center);

  const siteDirection = geographicDirection(launchSite.longitude, launchSite.latitude);
  const facingDirection = viewerPosition.clone().sub(center).normalize();
  group.quaternion.copy(resolveOrientation(siteDirection, facingDirection));

  const globe = new Mesh(
    new SphereGeometry(earthRadius, 64, 48),
    new MeshStandardMaterial({ map: createEarthTexture(palette), roughness: 1 }),
  );

  const markerMaterial = new MeshBasicMaterial({
    color: palette.color('accent'),
    side: DoubleSide,
    transparent: true,
  });
  const markerOrientation = new Quaternion().setFromUnitVectors(ringNormal, siteDirection);

  const beacon = new Mesh(new SphereGeometry(0.9, 12, 8), markerMaterial);
  beacon.position.copy(siteDirection).multiplyScalar(earthRadius + 0.4);

  const pulse = new Mesh(new RingGeometry(2.6, 3, 40), markerMaterial);
  pulse.position.copy(siteDirection).multiplyScalar(earthRadius + 0.6);
  pulse.quaternion.copy(markerOrientation);

  group.add(globe, beacon, pulse);

  return {
    group,
    update(elapsedTime) {
      const phase = (elapsedTime * 0.5) % 1;
      pulse.scale.setScalar(1 + phase * 1.6);
      markerMaterial.opacity = 1 - phase * 0.6;
    },
  };
}

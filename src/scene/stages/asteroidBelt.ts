import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  DynamicDrawUsage,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { roughenGeometry } from '../core/geometry';
import { clamp, createSeededRandom, damp } from '../core/math';
import { resolveStepLocalProgress } from '../core/panelMath';
import { createGlowTexture } from '../core/textures';
import type { Stage, StageOptions } from '../core/types';

const anchor = new Vector3(26, 175, -230);
const fieldSize = new Vector3(80, 36, 120);
const baseAsteroidCount = 150;
const clearanceRadius = 5;
const clearanceSamples = 24;
const starSideOffset = 8;
const starHeightOffset = 4.5;
const starDepthOffset = -9;
const linePointsPerSegment = 24;
const upcomingStarScale = 3;
const reachedStarScale = 5.5;
const activeStarScale = 8.5;
const minorStarScale = 1.6;

interface DriftingAsteroid {
  position: Vector3;
  scale: Vector3;
  rotation: Euler;
  spin: Vector3;
}

interface ConstellationStar {
  position: Vector3;
  sprite: Sprite;
  material: SpriteMaterial;
}

export function createAsteroidBelt({ content, quality, palette }: StageOptions): Stage {
  const group = new Group();
  const random = createSeededRandom(42);

  const waypoints = [
    anchor.clone().add(new Vector3(-8, -3, 44)),
    anchor.clone().add(new Vector3(8, 2, 22)),
    anchor.clone().add(new Vector3(-7, -1, 0)),
    anchor.clone().add(new Vector3(7, 3, -22)),
    anchor.clone().add(new Vector3(0, 0, -44)),
  ];
  const route = new CatmullRomCurve3(waypoints);
  const routeSamples = route.getPoints(clearanceSamples);

  const rockMaterial = new MeshStandardMaterial({
    color: palette.color('rock'),
    roughness: 1,
    flatShading: true,
  });

  const asteroidCount = Math.round(baseAsteroidCount * quality.density);
  const asteroids: DriftingAsteroid[] = [];
  while (asteroids.length < asteroidCount) {
    const position = new Vector3(
      (random() - 0.5) * fieldSize.x,
      (random() - 0.5) * fieldSize.y,
      (random() - 0.5) * fieldSize.z,
    ).add(anchor);
    const blocksRoute = routeSamples.some((sample) => sample.distanceTo(position) < clearanceRadius);
    if (blocksRoute) {
      continue;
    }
    const size = 0.35 + random() * random() * 2.4;
    asteroids.push({
      position,
      scale: new Vector3(size, size * (0.7 + random() * 0.5), size * (0.7 + random() * 0.5)),
      rotation: new Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
      spin: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.5),
    });
  }

  const field = new InstancedMesh(
    roughenGeometry(new IcosahedronGeometry(1, 1), 0.22, 1),
    rockMaterial,
    asteroidCount,
  );
  field.instanceMatrix.setUsage(DynamicDrawUsage);
  field.frustumCulled = false;
  group.add(field);

  const glowTexture = createGlowTexture();
  const accentColor = palette.color('accent');

  function createStarSprite(scale: number, opacity: number): { sprite: Sprite; material: SpriteMaterial } {
    const material = new SpriteMaterial({
      map: glowTexture,
      color: accentColor,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity,
    });
    const sprite = new Sprite(material);
    sprite.scale.setScalar(scale);
    return { sprite, material };
  }

  const stars: ConstellationStar[] = [];
  for (let projectIndex = 0; projectIndex < content.projectCount; projectIndex += 1) {
    const localProgress = resolveStepLocalProgress(projectIndex, content.projectCount);
    const routeFraction = clamp(
      (localProgress * waypoints.length - 0.5) / (waypoints.length - 1),
      0,
      1,
    );
    const side = projectIndex % 2 === 0 ? 1 : -1;
    const position = route
      .getPoint(routeFraction)
      .add(new Vector3(side * starSideOffset, starHeightOffset + side, starDepthOffset));
    const { sprite, material } = createStarSprite(upcomingStarScale, 0.4);
    sprite.position.copy(position);
    group.add(sprite);
    stars.push({ position, sprite, material });
  }

  const constellationPath: Vector3[] = [];
  stars.forEach((star, starIndex) => {
    constellationPath.push(star.position);
    const nextStar = stars[starIndex + 1];
    if (nextStar) {
      const minorPosition = star.position
        .clone()
        .lerp(nextStar.position, 0.5)
        .add(new Vector3((random() - 0.5) * 5, 2 + random() * 3, (random() - 0.5) * 4));
      const minorStar = createStarSprite(minorStarScale, 0.7);
      minorStar.sprite.position.copy(minorPosition);
      group.add(minorStar.sprite);
      constellationPath.push(minorPosition);
    }
  });

  const linePoints: Vector3[] = [];
  for (let pathIndex = 0; pathIndex < constellationPath.length - 1; pathIndex += 1) {
    for (let pointIndex = 0; pointIndex < linePointsPerSegment; pointIndex += 1) {
      linePoints.push(
        constellationPath[pathIndex]
          .clone()
          .lerp(constellationPath[pathIndex + 1], pointIndex / linePointsPerSegment),
      );
    }
  }
  if (constellationPath.length > 0) {
    linePoints.push(constellationPath[constellationPath.length - 1].clone());
  }

  const lineGeometry = new BufferGeometry().setFromPoints(linePoints);
  lineGeometry.setDrawRange(0, 0);
  const constellationLine = new Line(
    lineGeometry,
    new LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.65 }),
  );
  constellationLine.frustumCulled = false;
  group.add(constellationLine);

  const instanceMatrix = new Matrix4();
  const instanceOrientation = new Quaternion();
  let activeStar = 0;

  return {
    id: 'projects',
    group,
    waypoints,
    cameraOffset: new Vector3(0, 2.5, 15),
    update({ elapsedTime, deltaTime }) {
      asteroids.forEach((asteroid, asteroidIndex) => {
        asteroid.rotation.x += asteroid.spin.x * deltaTime;
        asteroid.rotation.y += asteroid.spin.y * deltaTime;
        asteroid.rotation.z += asteroid.spin.z * deltaTime;
        instanceOrientation.setFromEuler(asteroid.rotation);
        instanceMatrix.compose(asteroid.position, instanceOrientation, asteroid.scale);
        field.setMatrixAt(asteroidIndex, instanceMatrix);
      });
      field.instanceMatrix.needsUpdate = true;

      stars.forEach((star, starIndex) => {
        const isActive = starIndex === activeStar;
        const isReached = starIndex <= activeStar;
        const pulse = isActive ? Math.sin(elapsedTime * 2.2) * 0.6 : 0;
        const targetScale = isActive
          ? activeStarScale + pulse
          : isReached
            ? reachedStarScale
            : upcomingStarScale;
        star.sprite.scale.setScalar(damp(star.sprite.scale.x, targetScale, 5, deltaTime));
        star.material.opacity = damp(star.material.opacity, isReached ? 1 : 0.4, 5, deltaTime);
      });
    },
    setStep(activeStep, stepProgress) {
      activeStar = activeStep;
      const stepCount = stars.length;
      const lineFraction =
        stepCount > 1 ? clamp((stepProgress * stepCount) / (stepCount - 1), 0, 1) : 0;
      lineGeometry.setDrawRange(0, Math.round(lineFraction * (linePoints.length - 1)) + 1);
    },
    readItemPosition(itemIndex, target) {
      const star = stars[itemIndex];
      return star ? target.copy(star.position) : null;
    },
  };
}

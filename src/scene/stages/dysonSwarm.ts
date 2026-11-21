import {
  AdditiveBlending,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { createSeededRandom, damp, dampingFactor } from '../core/math';
import { createGlowTexture } from '../core/textures';
import type { Stage, StageOptions } from '../core/types';

const anchor = new Vector3(-18, 190, -370);
const starRadius = 6;
const swarmRingCount = 6;
const basePlatesPerRing = 84;
const innerSwarmRadius = 15;
const swarmRingSpacing = 2.6;
const plateRadius = 0.85;
const plateHeightJitter = 0.3;
const innerCoronaScale = 24;
const outerCoronaScale = 64;
const plateAxis = new Vector3(0, 1, 0);
const worldUp = new Vector3(0, 1, 0);

const collectorOrbitRadius = 30;
const collectorRadius = 5.5;
const collectorThickness = 0.3;
const screenWidth = 6.4;
const screenHeight = 4;
const arcCenter = 0.75;
const arcStepAngle = 0.45;
const maximumArcSpan = 1.5;
const elevationSwing = 0.12;
const dockingDistance = 10;
const dockingDrop = 3;
const cameraDistance = 14;
const cameraLift = 2.5;
const restingRim = 0.45;
const activeRim = 1;

const starVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec3 vSurfacePosition;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    vSurfacePosition = position;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const starFragmentShader = `
  uniform vec3 coreColor;
  uniform vec3 limbColor;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec3 vSurfacePosition;

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

  void main() {
    float facing = max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
    float granulation =
      noise(vSurfacePosition * 0.9 + time * 0.15) * 0.6 +
      noise(vSurfacePosition * 2.3 - time * 0.1) * 0.4;
    vec3 color = mix(limbColor, coreColor, pow(facing, 0.6));
    color *= 0.72 + granulation * 0.56;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Collector {
  direction: Vector3;
  position: Vector3;
  body: Mesh;
  rimMaterial: LineBasicMaterial;
  screenMaterial: MeshBasicMaterial;
}

function resolveCollectorDirection(collectorIndex: number, collectorCount: number): Vector3 {
  const arcSpan = Math.min(maximumArcSpan, arcStepAngle * (collectorCount - 1));
  const arcFraction = collectorCount > 1 ? collectorIndex / (collectorCount - 1) - 0.5 : 0;
  const azimuth = arcCenter + arcFraction * arcSpan;
  const elevation = (collectorIndex % 2 === 0 ? 1 : -1) * elevationSwing;
  return new Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
}

export function createDysonSwarm({ content, quality, palette }: StageOptions): Stage {
  const group = new Group();
  const random = createSeededRandom(2025);
  const accentColor = palette.color('accent');
  const interactiveColor = palette.color('interactive');

  const system = new Group();
  system.position.copy(anchor);
  group.add(system);

  const starMaterial = new ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    uniforms: {
      coreColor: { value: accentColor.clone().lerp(palette.color('text'), 0.75) },
      limbColor: { value: accentColor.clone() },
      time: { value: 0 },
    },
  });
  const star = new Mesh(new SphereGeometry(starRadius, 48, 32), starMaterial);

  const glowTexture = createGlowTexture();
  function createCorona(scale: number, opacity: number): Sprite {
    const corona = new Sprite(
      new SpriteMaterial({
        map: glowTexture,
        color: accentColor,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity,
      }),
    );
    corona.scale.setScalar(scale);
    return corona;
  }
  const innerCorona = createCorona(innerCoronaScale, 0.9);
  const outerCorona = createCorona(outerCoronaScale, 0.35);
  const starLight = new PointLight(accentColor, 1400, 0, 2);
  system.add(star, innerCorona, outerCorona, starLight);

  const plateMaterial = new MeshStandardMaterial({
    color: palette.color('solarPanel'),
    roughness: 0.4,
    metalness: 0.6,
    flatShading: true,
  });
  const plateGeometry = new CylinderGeometry(plateRadius, plateRadius, 0.05, 6);
  const platesPerRing = Math.round(basePlatesPerRing * quality.density);
  const swarmRings: { ring: Group; speed: number }[] = [];
  const plateMatrix = new Matrix4();
  const plateOrientation = new Quaternion();
  const plateScale = new Vector3(1, 1, 1);
  const platePosition = new Vector3();
  const radialDirection = new Vector3();

  for (let ringIndex = 0; ringIndex < swarmRingCount; ringIndex += 1) {
    const ring = new Group();
    ring.rotation.set(random() * Math.PI, 0, random() * Math.PI);
    const plates = new InstancedMesh(plateGeometry, plateMaterial, platesPerRing);
    const radius = innerSwarmRadius + ringIndex * swarmRingSpacing;
    for (let plateIndex = 0; plateIndex < platesPerRing; plateIndex += 1) {
      const angle = (plateIndex / platesPerRing) * Math.PI * 2 + random() * 0.08;
      radialDirection
        .set(Math.cos(angle), (random() - 0.5) * plateHeightJitter, Math.sin(angle))
        .normalize();
      platePosition.copy(radialDirection).multiplyScalar(radius);
      plateOrientation.setFromUnitVectors(plateAxis, radialDirection);
      plateMatrix.compose(platePosition, plateOrientation, plateScale);
      plates.setMatrixAt(plateIndex, plateMatrix);
    }
    plates.instanceMatrix.needsUpdate = true;
    ring.add(plates);
    system.add(ring);
    swarmRings.push({ ring, speed: (0.03 + random() * 0.05) * (ringIndex % 2 === 0 ? 1 : -1) });
  }

  const collectorGeometry = new CylinderGeometry(
    collectorRadius,
    collectorRadius,
    collectorThickness,
    6,
  );
  collectorGeometry.rotateX(Math.PI / 2);
  const collectorEdges = new EdgesGeometry(collectorGeometry);
  const screenGeometry = new PlaneGeometry(screenWidth, screenHeight);
  const collectorMaterial = new MeshStandardMaterial({
    color: palette.color('solarPanel'),
    roughness: 0.35,
    metalness: 0.7,
    flatShading: true,
  });
  const restingScreenColor = palette.color('hullDark');
  const activeScreenColor = palette.color('hullDark').lerp(accentColor, 0.45);
  const collectors: Collector[] = [];

  for (let collectorIndex = 0; collectorIndex < content.experienceCount; collectorIndex += 1) {
    const direction = resolveCollectorDirection(collectorIndex, content.experienceCount);
    const position = anchor.clone().addScaledVector(direction, collectorOrbitRadius);

    const collector = new Group();
    collector.position.copy(position);
    collector.lookAt(position.clone().add(direction));

    const body = new Mesh(collectorGeometry, collectorMaterial);
    body.userData.itemIndex = collectorIndex;

    const rimMaterial = new LineBasicMaterial({
      color: accentColor.clone(),
      transparent: true,
      opacity: restingRim,
    });
    const rim = new LineSegments(collectorEdges, rimMaterial);

    const screenMaterial = new MeshBasicMaterial({ color: restingScreenColor.clone() });
    const screen = new Mesh(screenGeometry, screenMaterial);
    screen.position.z = collectorThickness / 2 + 0.02;

    collector.add(body, rim, screen);
    group.add(collector);
    collectors.push({ direction, position, body, rimMaterial, screenMaterial });
  }

  const dockingPoints = collectors.map((collector) =>
    collector.position
      .clone()
      .addScaledVector(collector.direction, dockingDistance)
      .addScaledVector(worldUp, -dockingDrop),
  );
  const firstDockingPoint = dockingPoints[0] ?? anchor.clone().add(new Vector3(26, -3, 30));
  const lastDockingPoint = dockingPoints[dockingPoints.length - 1] ?? firstDockingPoint;
  const waypoints = [
    firstDockingPoint.clone().add(new Vector3(4, -3, 18)),
    ...dockingPoints,
    lastDockingPoint.clone().add(new Vector3(4, 3, -16)),
  ];

  const cameraOffset = new Vector3(0, cameraLift, cameraDistance);
  const focusPoint = (collectors[0]?.position ?? anchor).clone();
  const outwardDirection = new Vector3();
  let highlightedCollector: number | null = null;
  let activeCollector = 0;

  return {
    id: 'experience',
    group,
    waypoints,
    cameraOffset,
    focusPoint,
    focusWeight: 0.8,
    pickables: collectors.map((collector) => collector.body),
    update({ elapsedTime, deltaTime, rocketPosition }) {
      for (const swarmRing of swarmRings) {
        swarmRing.ring.rotation.y += swarmRing.speed * deltaTime;
      }
      starMaterial.uniforms.time.value = elapsedTime;
      innerCorona.scale.setScalar(innerCoronaScale + Math.sin(elapsedTime * 0.8) * 1.2);

      outwardDirection.copy(rocketPosition).sub(anchor).normalize();
      cameraOffset
        .copy(outwardDirection)
        .multiplyScalar(cameraDistance)
        .addScaledVector(worldUp, cameraLift);

      const focusedCollector = collectors[activeCollector];
      if (focusedCollector) {
        focusPoint.lerp(focusedCollector.position, dampingFactor(3, deltaTime));
      }

      collectors.forEach((collector, collectorIndex) => {
        const isActive = collectorIndex === activeCollector;
        const isHighlighted = collectorIndex === highlightedCollector;
        collector.rimMaterial.opacity = damp(
          collector.rimMaterial.opacity,
          isActive || isHighlighted ? activeRim : restingRim,
          6,
          deltaTime,
        );
        collector.rimMaterial.color.lerp(isHighlighted ? interactiveColor : accentColor, 0.15);
        collector.screenMaterial.color.lerp(
          isActive ? activeScreenColor : restingScreenColor,
          dampingFactor(4, deltaTime),
        );
      });
    },
    setHighlight(itemIndex) {
      highlightedCollector = itemIndex;
    },
    setStep(activeStep) {
      activeCollector = activeStep;
    },
  };
}

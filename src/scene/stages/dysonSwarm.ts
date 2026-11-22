import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  Quaternion,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
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
const plateWidth = 1.5;
const plateDepth = 0.8;
const plateHeightJitter = 0.3;
const orbitTrackSegments = 128;
const orbitTrackOpacity = 0.09;
const innerCoronaScale = 24;
const outerCoronaScale = 64;
const plateAxis = new Vector3(0, 1, 0);
const worldUp = new Vector3(0, 1, 0);

const collectorOrbitRadius = 30;
const hubRadius = 1.1;
const hingeRadius = 1.5;
const petalCount = 8;
const petalLength = 4.6;
const petalInnerWidth = 0.7;
const petalOuterWidth = 2.6;
const petalShoulder = 0.78;
const petalCellFractions = [0.3, 0.55, 0.78];
const restingPetalTilt = -0.8;
const activePetalTilt = -0.16;
const gyroscopeRadius = 2.3;
const gyroscopeTube = 0.06;
const gyroscopeTilt = 1.15;
const restingGyroscopeSpeed = 0.5;
const activeGyroscopeSpeed = 2.4;
const restingCoreGlow = 3;
const activeCoreGlow = 6.5;
const restingBeam = 0.18;
const activeBeam = 1;
const beamStart = hubRadius * 0.5;
const beamLength = collectorOrbitRadius - starRadius - beamStart - 1;
const activeEmissive = 0.22;
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

const beamVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    float pulse = pow(fract(vUv.y * 5.0 - time * 0.9), 6.0);
    float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    float alpha = (0.14 + pulse * 0.86) * fade * intensity;
    gl_FragColor = vec4(color * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

interface Collector {
  direction: Vector3;
  position: Vector3;
  hub: Mesh;
  hitArea: Mesh;
  hinges: Group[];
  gyroscope: Group;
  coreGlow: Sprite;
  rimMaterial: LineBasicMaterial;
  petalMaterial: MeshStandardMaterial;
  beamMaterial: ShaderMaterial;
  activation: number;
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

function resolvePetalHalfWidth(height: number): number {
  const shoulderHeight = petalLength * petalShoulder;
  if (height <= shoulderHeight) {
    return MathUtils.lerp(petalInnerWidth, petalOuterWidth, height / shoulderHeight) / 2;
  }
  return ((petalOuterWidth / 2) * (petalLength - height)) / (petalLength - shoulderHeight);
}

function createPetalOutline(): [number, number][] {
  const shoulderHeight = petalLength * petalShoulder;
  return [
    [-petalInnerWidth / 2, 0],
    [petalInnerWidth / 2, 0],
    [petalOuterWidth / 2, shoulderHeight],
    [0, petalLength],
    [-petalOuterWidth / 2, shoulderHeight],
  ];
}

function createPetalGeometry(): ShapeGeometry {
  const [firstCorner, ...remainingCorners] = createPetalOutline();
  const shape = new Shape();
  shape.moveTo(firstCorner[0], firstCorner[1]);
  for (const [cornerX, cornerY] of remainingCorners) {
    shape.lineTo(cornerX, cornerY);
  }
  shape.closePath();
  return new ShapeGeometry(shape);
}

function createPetalLines(): BufferGeometry {
  const outline = createPetalOutline();
  const segments: number[] = [];
  outline.forEach(([cornerX, cornerY], cornerIndex) => {
    const [nextX, nextY] = outline[(cornerIndex + 1) % outline.length];
    segments.push(cornerX, cornerY, 0, nextX, nextY, 0);
  });
  for (const fraction of petalCellFractions) {
    const height = petalLength * fraction;
    const halfWidth = resolvePetalHalfWidth(height);
    segments.push(-halfWidth, height, 0, halfWidth, height, 0);
  }
  segments.push(0, 0, 0, 0, petalLength, 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(segments, 3));
  return geometry;
}

function createOrbitTrack(radius: number): BufferGeometry {
  const points = Array.from({ length: orbitTrackSegments }, (_, pointIndex) => {
    const angle = (pointIndex / orbitTrackSegments) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
  return new BufferGeometry().setFromPoints(points);
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
  function createGlow(scale: number, opacity: number): Sprite {
    const glow = new Sprite(
      new SpriteMaterial({
        map: glowTexture,
        color: accentColor,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity,
      }),
    );
    glow.scale.setScalar(scale);
    return glow;
  }
  const innerCorona = createGlow(innerCoronaScale, 0.9);
  const outerCorona = createGlow(outerCoronaScale, 0.35);
  const starLight = new PointLight(accentColor, 1400, 0, 2);
  system.add(star, innerCorona, outerCorona, starLight);

  const plateMaterial = new MeshStandardMaterial({
    color: palette.color('solarPanel'),
    roughness: 0.4,
    metalness: 0.6,
    flatShading: true,
  });
  const plateGeometry = new BoxGeometry(plateWidth, 0.04, plateDepth);
  const orbitTrackMaterial = new LineBasicMaterial({
    color: interactiveColor,
    transparent: true,
    opacity: orbitTrackOpacity,
    blending: AdditiveBlending,
    depthWrite: false,
  });
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
    ring.add(plates, new LineLoop(createOrbitTrack(radius), orbitTrackMaterial));
    system.add(ring);
    swarmRings.push({ ring, speed: (0.03 + random() * 0.05) * (ringIndex % 2 === 0 ? 1 : -1) });
  }

  const hubGeometry = new IcosahedronGeometry(hubRadius, 0);
  const hubMaterial = new MeshStandardMaterial({
    color: palette.color('hull'),
    roughness: 0.3,
    metalness: 0.8,
    flatShading: true,
  });
  const gyroscopeGeometry = new TorusGeometry(gyroscopeRadius, gyroscopeTube, 6, 64);
  const gyroscopeMaterial = new MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.8,
  });
  const petalGeometry = createPetalGeometry();
  const petalLines = createPetalLines();
  const beamGeometry = new CylinderGeometry(0.12, 0.55, beamLength, 16, 1, true);
  beamGeometry.rotateX(Math.PI / 2);
  const beamTime = { value: 0 };
  const hitGeometry = new SphereGeometry(hingeRadius + petalLength * 0.8, 12, 8);
  const hitMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const collectors: Collector[] = [];

  for (let collectorIndex = 0; collectorIndex < content.experienceCount; collectorIndex += 1) {
    const direction = resolveCollectorDirection(collectorIndex, content.experienceCount);
    const position = anchor.clone().addScaledVector(direction, collectorOrbitRadius);

    const collector = new Group();
    collector.position.copy(position);
    collector.lookAt(position.clone().add(direction));

    const hub = new Mesh(hubGeometry, hubMaterial);
    const coreGlow = createGlow(restingCoreGlow, 0.9);

    const gyroscope = new Group();
    const gyroscopeRing = new Mesh(gyroscopeGeometry, gyroscopeMaterial);
    gyroscopeRing.rotation.x = gyroscopeTilt;
    gyroscope.add(gyroscopeRing);

    const rimMaterial = new LineBasicMaterial({
      color: accentColor.clone(),
      transparent: true,
      opacity: restingRim,
    });
    const petalMaterial = new MeshStandardMaterial({
      color: palette.color('solarPanel'),
      roughness: 0.3,
      metalness: 0.55,
      flatShading: true,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const hinges: Group[] = [];
    for (let petalIndex = 0; petalIndex < petalCount; petalIndex += 1) {
      const arm = new Group();
      arm.rotation.z = (petalIndex / petalCount) * Math.PI * 2;
      const hinge = new Group();
      hinge.position.y = hingeRadius;
      hinge.rotation.x = restingPetalTilt;
      hinge.add(new Mesh(petalGeometry, petalMaterial), new LineSegments(petalLines, rimMaterial));
      arm.add(hinge);
      collector.add(arm);
      hinges.push(hinge);
    }

    const beamMaterial = new ShaderMaterial({
      vertexShader: beamVertexShader,
      fragmentShader: beamFragmentShader,
      uniforms: {
        color: { value: accentColor.clone() },
        time: beamTime,
        intensity: { value: restingBeam },
      },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    const beam = new Mesh(beamGeometry, beamMaterial);
    beam.position.z = -(beamStart + beamLength / 2);

    const hitArea = new Mesh(hitGeometry, hitMaterial);
    hitArea.userData.itemIndex = collectorIndex;

    collector.add(hub, coreGlow, gyroscope, beam, hitArea);
    group.add(collector);
    collectors.push({
      direction,
      position,
      hub,
      hitArea,
      hinges,
      gyroscope,
      coreGlow,
      rimMaterial,
      petalMaterial,
      beamMaterial,
      activation: 0,
    });
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
    pickables: collectors.map((collector) => collector.hitArea),
    update({ elapsedTime, deltaTime, rocketPosition }) {
      for (const swarmRing of swarmRings) {
        swarmRing.ring.rotation.y += swarmRing.speed * deltaTime;
      }
      starMaterial.uniforms.time.value = elapsedTime;
      beamTime.value = elapsedTime;
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
        collector.activation = damp(collector.activation, isActive ? 1 : 0, 3, deltaTime);
        const activation = collector.activation;

        const petalTilt = MathUtils.lerp(restingPetalTilt, activePetalTilt, activation);
        for (const hinge of collector.hinges) {
          hinge.rotation.x = petalTilt;
        }
        collector.gyroscope.rotation.z +=
          MathUtils.lerp(restingGyroscopeSpeed, activeGyroscopeSpeed, activation) * deltaTime;
        collector.hub.rotation.y += 0.25 * deltaTime;
        collector.hub.rotation.x += 0.12 * deltaTime;
        collector.coreGlow.scale.setScalar(
          MathUtils.lerp(restingCoreGlow, activeCoreGlow, activation) +
            Math.sin(elapsedTime * 3 + collectorIndex) * 0.3,
        );
        collector.beamMaterial.uniforms.intensity.value = MathUtils.lerp(
          restingBeam,
          activeBeam,
          activation,
        );
        collector.petalMaterial.emissive.copy(accentColor).multiplyScalar(activation * activeEmissive);

        collector.rimMaterial.opacity = damp(
          collector.rimMaterial.opacity,
          isActive || isHighlighted ? activeRim : restingRim,
          6,
          deltaTime,
        );
        collector.rimMaterial.color.lerp(isHighlighted ? interactiveColor : accentColor, 0.15);
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

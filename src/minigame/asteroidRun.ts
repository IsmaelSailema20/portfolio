import {
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  type Scene,
  Vector3,
} from 'three';
import { roughenGeometry } from '../scene/core/geometry';
import { createSeededRandom } from '../scene/core/math';
import type { Palette } from '../scene/core/palette';
import { hasCollision, remainingSeconds, resolveAxisInput, stepOffset } from './rules';

export interface AsteroidRun {
  readonly offset: Vector3;
  update(deltaTime: number, rocketBasePosition: Vector3): boolean;
  dispose(): void;
}

interface AsteroidRunOptions {
  scene: Scene;
  palette: Palette;
}

const duration = 20;
const steeringSpeed = 13;
const horizontalLimit = 8;
const verticalLimit = 4.5;
const meteorCount = 14;
const meteorSpeed = 40;
const spawnInterval = 0.42;
const spawnDistance = 75;
const despawnDistance = 18;
const collisionRadius = 1.7;

const negativeHorizontalKeys = ['ArrowLeft', 'KeyA'];
const positiveHorizontalKeys = ['ArrowRight', 'KeyD'];
const negativeVerticalKeys = ['ArrowDown', 'KeyS'];
const positiveVerticalKeys = ['ArrowUp', 'KeyW'];
const steeringKeys = [
  ...negativeHorizontalKeys,
  ...positiveHorizontalKeys,
  ...negativeVerticalKeys,
  ...positiveVerticalKeys,
];

export function createAsteroidRun({ scene, palette }: AsteroidRunOptions): AsteroidRun {
  const hud = document.querySelector<HTMLElement>('[data-minigame-hud]');
  const timeLabel = hud?.querySelector<HTMLElement>('[data-minigame-time]');
  const hitsLabel = hud?.querySelector<HTMLElement>('[data-minigame-hits]');
  const random = createSeededRandom(Date.now());
  const pressedKeys = new Set<string>();
  const offset = new Vector3();
  const rocketPosition = new Vector3();

  const meteorMaterial = new MeshStandardMaterial({
    color: palette.color('rock'),
    emissive: palette.color('accent'),
    emissiveIntensity: 0.35,
    roughness: 1,
    flatShading: true,
  });
  const meteorGeometry = roughenGeometry(new IcosahedronGeometry(1.1, 1), 0.25, 4);
  const meteors = new Group();
  const idleMeteors: Mesh[] = [];
  for (let meteorIndex = 0; meteorIndex < meteorCount; meteorIndex += 1) {
    const meteor = new Mesh(meteorGeometry, meteorMaterial);
    meteor.visible = false;
    meteors.add(meteor);
    idleMeteors.push(meteor);
  }
  scene.add(meteors);

  let elapsed = 0;
  let hits = 0;
  let sinceLastSpawn = 0;
  let wasCancelled = false;

  function isPressed(keys: string[]): boolean {
    return keys.some((key) => pressedKeys.has(key));
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      wasCancelled = true;
      return;
    }
    if (steeringKeys.includes(event.code) || event.code === 'Space') {
      event.preventDefault();
      pressedKeys.add(event.code);
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    pressedKeys.delete(event.code);
  }

  function recycle(meteor: Mesh): void {
    meteor.visible = false;
    idleMeteors.push(meteor);
  }

  function spawn(rocketBasePosition: Vector3): void {
    const meteor = idleMeteors.pop();
    if (!meteor) {
      return;
    }
    meteor.position.set(
      rocketBasePosition.x + (random() * 2 - 1) * horizontalLimit,
      rocketBasePosition.y + (random() * 2 - 1) * verticalLimit,
      rocketBasePosition.z - spawnDistance,
    );
    meteor.rotation.set(random() * Math.PI, random() * Math.PI, 0);
    meteor.visible = true;
  }

  function renderHud(): void {
    if (timeLabel) {
      timeLabel.textContent = String(remainingSeconds(duration, elapsed));
    }
    if (hitsLabel) {
      hitsLabel.textContent = String(hits);
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  document.documentElement.classList.add('is-playing');
  if (hud) {
    hud.hidden = false;
  }
  renderHud();

  return {
    offset,
    update(deltaTime, rocketBasePosition) {
      elapsed += deltaTime;
      sinceLastSpawn += deltaTime;

      offset.x = stepOffset(
        offset.x,
        resolveAxisInput(isPressed(negativeHorizontalKeys), isPressed(positiveHorizontalKeys)),
        steeringSpeed,
        deltaTime,
        horizontalLimit,
      );
      offset.y = stepOffset(
        offset.y,
        resolveAxisInput(isPressed(negativeVerticalKeys), isPressed(positiveVerticalKeys)),
        steeringSpeed,
        deltaTime,
        verticalLimit,
      );
      rocketPosition.copy(rocketBasePosition).add(offset);

      if (sinceLastSpawn >= spawnInterval) {
        sinceLastSpawn = 0;
        spawn(rocketBasePosition);
      }

      for (const child of meteors.children) {
        const meteor = child as Mesh;
        if (!meteor.visible) {
          continue;
        }
        meteor.position.z += meteorSpeed * deltaTime;
        meteor.rotation.x += deltaTime;
        if (hasCollision(meteor.position, rocketPosition, collisionRadius)) {
          hits += 1;
          recycle(meteor);
        } else if (meteor.position.z > rocketBasePosition.z + despawnDistance) {
          recycle(meteor);
        }
      }

      renderHud();
      return !wasCancelled && elapsed < duration;
    },
    dispose() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.documentElement.classList.remove('is-playing');
      if (hud) {
        hud.hidden = true;
      }
      scene.remove(meteors);
      meteorGeometry.dispose();
      meteorMaterial.dispose();
    },
  };
}

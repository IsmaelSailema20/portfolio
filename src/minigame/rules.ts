export interface Point {
  x: number;
  y: number;
  z: number;
}

export function stepOffset(
  current: number,
  input: number,
  speed: number,
  deltaTime: number,
  limit: number,
): number {
  const next = current + input * speed * deltaTime;
  return Math.min(Math.max(next, -limit), limit);
}

export function hasCollision(first: Point, second: Point, radius: number): boolean {
  const distanceX = first.x - second.x;
  const distanceY = first.y - second.y;
  const distanceZ = first.z - second.z;
  return distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ < radius * radius;
}

export function remainingSeconds(duration: number, elapsed: number): number {
  return Math.max(Math.ceil(duration - elapsed), 0);
}

export function resolveAxisInput(negativePressed: boolean, positivePressed: boolean): number {
  return Number(positivePressed) - Number(negativePressed);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  const normalized = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function dampingFactor(smoothing: number, deltaTime: number): number {
  return 1 - Math.exp(-smoothing * deltaTime);
}

export function damp(current: number, target: number, smoothing: number, deltaTime: number): number {
  return current + (target - current) * dampingFactor(smoothing, deltaTime);
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

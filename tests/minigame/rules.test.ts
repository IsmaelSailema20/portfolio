import { describe, expect, it } from 'vitest';
import {
  hasCollision,
  remainingSeconds,
  resolveAxisInput,
  stepOffset,
} from '../../src/minigame/rules';

const origin = { x: 0, y: 0, z: 0 };

describe('stepOffset', () => {
  it('moves in the positive direction', () => {
    expect(stepOffset(0, 1, 10, 0.5, 8)).toBe(5);
  });

  it('moves in the negative direction', () => {
    expect(stepOffset(0, -1, 10, 0.5, 8)).toBe(-5);
  });

  it('stays in place without input', () => {
    expect(stepOffset(2, 0, 10, 0.5, 8)).toBe(2);
  });

  it('stops at the positive limit', () => {
    expect(stepOffset(5, 1, 10, 0.5, 8)).toBe(8);
  });

  it('stops at the negative limit', () => {
    expect(stepOffset(-5, -1, 10, 0.5, 8)).toBe(-8);
  });
});

describe('hasCollision', () => {
  it('detects overlap on each axis', () => {
    expect(hasCollision(origin, { x: 1, y: 0, z: 0 }, 1.5)).toBe(true);
    expect(hasCollision(origin, { x: 0, y: 1, z: 0 }, 1.5)).toBe(true);
    expect(hasCollision(origin, { x: 0, y: 0, z: 1 }, 1.5)).toBe(true);
  });

  it('ignores distant points on each axis', () => {
    expect(hasCollision(origin, { x: 2, y: 0, z: 0 }, 1.5)).toBe(false);
    expect(hasCollision(origin, { x: 0, y: 2, z: 0 }, 1.5)).toBe(false);
    expect(hasCollision(origin, { x: 0, y: 0, z: 2 }, 1.5)).toBe(false);
  });

  it('combines the three axes', () => {
    const diagonal = { x: 1, y: 1, z: 1 };
    expect(hasCollision(origin, diagonal, 1.7)).toBe(false);
    expect(hasCollision(origin, diagonal, 1.8)).toBe(true);
  });

  it('measures the distance between both points', () => {
    expect(hasCollision({ x: 5, y: 5, z: 5 }, { x: 5.5, y: 5, z: 5 }, 1)).toBe(true);
    expect(hasCollision({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1.5)).toBe(false);
  });

  it('does not collide exactly at the radius', () => {
    expect(hasCollision(origin, { x: 2, y: 0, z: 0 }, 2)).toBe(false);
  });
});

describe('remainingSeconds', () => {
  it('shows the full duration at the start', () => {
    expect(remainingSeconds(20, 0)).toBe(20);
  });

  it('rounds partial seconds up', () => {
    expect(remainingSeconds(20, 19.5)).toBe(1);
  });

  it('reaches zero at the end', () => {
    expect(remainingSeconds(20, 20)).toBe(0);
  });

  it('never goes below zero', () => {
    expect(remainingSeconds(20, 25)).toBe(0);
  });
});

describe('resolveAxisInput', () => {
  it('is positive when only the positive key is pressed', () => {
    expect(resolveAxisInput(false, true)).toBe(1);
  });

  it('is negative when only the negative key is pressed', () => {
    expect(resolveAxisInput(true, false)).toBe(-1);
  });

  it('cancels out when both keys are pressed', () => {
    expect(resolveAxisInput(true, true)).toBe(0);
  });

  it('is neutral when no key is pressed', () => {
    expect(resolveAxisInput(false, false)).toBe(0);
  });
});

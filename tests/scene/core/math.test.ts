import { describe, expect, it } from 'vitest';
import {
  clamp,
  createSeededRandom,
  damp,
  dampingFactor,
  smoothstep,
} from '../../../src/scene/core/math';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('limits values above the maximum', () => {
    expect(clamp(5, 0, 3)).toBe(3);
  });

  it('limits values below the minimum', () => {
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});

describe('smoothstep', () => {
  it('returns zero before the start edge', () => {
    expect(smoothstep(2, 4, 1)).toBe(0);
  });

  it('returns one after the end edge', () => {
    expect(smoothstep(2, 4, 5)).toBe(1);
  });

  it('returns one half at the midpoint', () => {
    expect(smoothstep(2, 4, 3)).toBe(0.5);
  });

  it('eases in near the start edge', () => {
    expect(smoothstep(0, 1, 0.25)).toBe(0.15625);
  });
});

describe('dampingFactor', () => {
  it('is zero without smoothing', () => {
    expect(dampingFactor(0, 1)).toBe(0);
  });

  it('is zero without elapsed time', () => {
    expect(dampingFactor(5, 0)).toBe(0);
  });

  it('halves the distance after one half-life', () => {
    expect(dampingFactor(Math.LN2, 1)).toBeCloseTo(0.5, 10);
  });

  it('scales with elapsed time', () => {
    expect(dampingFactor(Math.LN2, 2)).toBeCloseTo(0.75, 10);
  });
});

describe('damp', () => {
  it('moves up toward the target', () => {
    expect(damp(0, 10, Math.LN2, 1)).toBeCloseTo(5, 10);
  });

  it('moves down toward the target', () => {
    expect(damp(10, 0, Math.LN2, 1)).toBeCloseTo(5, 10);
  });

  it('stays at the target', () => {
    expect(damp(3, 3, 4, 0.5)).toBe(3);
  });
});

describe('createSeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('produces different sequences for different seeds', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it('produces distinct values within the unit interval', () => {
    const random = createSeededRandom(7);
    const values = Array.from({ length: 200 }, () => random());
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(190);
  });
});

import { describe, expect, it } from 'vitest';
import {
  arrivalProgress,
  defaultPanelWindow,
  resolveActiveStep,
  resolvePresence,
  resolveRouteFill,
  resolveStepLocalProgress,
  resolveStepProgress,
  resolveStepTarget,
  stepRange,
} from '../../../src/scene/core/panelMath';

describe('resolveStepTarget', () => {
  const stepCounts = [0, 3, 5, 0];

  it('moves to the next and previous step inside a stage', () => {
    expect(resolveStepTarget(1, 0, stepCounts, 1)).toEqual({ stagePosition: 1, stepIndex: 1 });
    expect(resolveStepTarget(1, 2, stepCounts, -1)).toEqual({ stagePosition: 1, stepIndex: 1 });
  });

  it('enters the next stage at its first step after the last step', () => {
    expect(resolveStepTarget(1, 2, stepCounts, 1)).toEqual({ stagePosition: 2, stepIndex: 0 });
  });

  it('enters the previous stage at its last step before the first step', () => {
    expect(resolveStepTarget(2, 0, stepCounts, -1)).toEqual({ stagePosition: 1, stepIndex: 2 });
  });

  it('targets the whole stage when it has no steps', () => {
    expect(resolveStepTarget(2, 4, stepCounts, 1)).toEqual({ stagePosition: 3, stepIndex: null });
    expect(resolveStepTarget(1, 0, stepCounts, -1)).toEqual({ stagePosition: 0, stepIndex: null });
  });

  it('leaves stages without steps for their neighbours', () => {
    expect(resolveStepTarget(0, 0, stepCounts, 1)).toEqual({ stagePosition: 1, stepIndex: 0 });
    expect(resolveStepTarget(3, 0, stepCounts, -1)).toEqual({ stagePosition: 2, stepIndex: 4 });
  });

  it('stops at both ends of the journey', () => {
    expect(resolveStepTarget(0, 0, stepCounts, -1)).toBeNull();
    expect(resolveStepTarget(3, 0, stepCounts, 1)).toBeNull();
  });

  it('ignores a shift of zero', () => {
    expect(resolveStepTarget(0, 0, stepCounts, 0)).toBeNull();
  });

  it('jumps to a step several positions away', () => {
    expect(resolveStepTarget(2, 0, stepCounts, 3)).toEqual({ stagePosition: 2, stepIndex: 3 });
  });
});

describe('panel settings', () => {
  it('fades panels in and out near the stage edges', () => {
    expect(defaultPanelWindow).toEqual({ enter: [0.04, 0.14], exit: [0.86, 0.96] });
  });

  it('runs steps between the fades', () => {
    expect(stepRange).toEqual([0.14, 0.86]);
  });

  it('arrives after the panel has faded in', () => {
    expect(arrivalProgress).toBe(0.3);
  });
});

describe('resolvePresence', () => {
  it('is hidden before the stage starts', () => {
    expect(resolvePresence(-0.5, defaultPanelWindow)).toBe(0);
    expect(resolvePresence(0.04, defaultPanelWindow)).toBe(0);
  });

  it('fades in across the enter range', () => {
    expect(resolvePresence(0.09, defaultPanelWindow)).toBeCloseTo(0.5, 10);
  });

  it('is fully present in the middle of the stage', () => {
    expect(resolvePresence(0.14, defaultPanelWindow)).toBe(1);
    expect(resolvePresence(0.5, defaultPanelWindow)).toBe(1);
    expect(resolvePresence(0.86, defaultPanelWindow)).toBe(1);
  });

  it('fades out across the exit range', () => {
    expect(resolvePresence(0.91, defaultPanelWindow)).toBeCloseTo(0.5, 10);
  });

  it('is hidden after the stage ends', () => {
    expect(resolvePresence(0.96, defaultPanelWindow)).toBe(0);
    expect(resolvePresence(1.5, defaultPanelWindow)).toBe(0);
  });

  it('stays present from the start without an enter range', () => {
    const openingWindow = { enter: null, exit: [0.3, 0.5] as [number, number] };
    expect(resolvePresence(-1, openingWindow)).toBe(1);
    expect(resolvePresence(0.4, openingWindow)).toBeCloseTo(0.5, 10);
    expect(resolvePresence(0.6, openingWindow)).toBe(0);
  });

  it('stays present until the end without an exit range', () => {
    const closingWindow = { enter: [0.04, 0.14] as [number, number], exit: null };
    expect(resolvePresence(0, closingWindow)).toBe(0);
    expect(resolvePresence(2, closingWindow)).toBe(1);
  });
});

describe('resolveStepProgress', () => {
  it('starts when the panel is fully present', () => {
    expect(resolveStepProgress(0)).toBe(0);
    expect(resolveStepProgress(0.14)).toBe(0);
  });

  it('is halfway at the middle of the stage', () => {
    expect(resolveStepProgress(0.5)).toBeCloseTo(0.5, 10);
  });

  it('ends before the panel fades out', () => {
    expect(resolveStepProgress(0.86)).toBe(1);
    expect(resolveStepProgress(1)).toBe(1);
  });
});

describe('resolveActiveStep', () => {
  it('splits the progress evenly between steps', () => {
    expect(resolveActiveStep(0, 3)).toBe(0);
    expect(resolveActiveStep(0.34, 3)).toBe(1);
    expect(resolveActiveStep(0.67, 3)).toBe(2);
  });

  it('keeps the last step at the end', () => {
    expect(resolveActiveStep(1, 3)).toBe(2);
    expect(resolveActiveStep(1, 1)).toBe(0);
  });

  it('returns the first step without steps', () => {
    expect(resolveActiveStep(0.5, 0)).toBe(0);
  });
});

describe('resolveStepLocalProgress', () => {
  it('targets the center of the first step', () => {
    expect(resolveStepLocalProgress(0, 3)).toBeCloseTo(0.26, 10);
  });

  it('targets the center of the last step', () => {
    expect(resolveStepLocalProgress(2, 3)).toBeCloseTo(0.74, 10);
  });

  it('targets the middle of the stage for a single step', () => {
    expect(resolveStepLocalProgress(0, 1)).toBeCloseTo(0.5, 10);
  });

  it('falls back to the arrival progress without steps', () => {
    expect(resolveStepLocalProgress(0, 0)).toBe(0.3);
  });

  it('activates the step it targets', () => {
    const localProgress = resolveStepLocalProgress(1, 4);
    expect(resolveActiveStep(resolveStepProgress(localProgress), 4)).toBe(1);
  });
});

describe('resolveRouteFill', () => {
  it('is empty until the first stop is centered', () => {
    expect(resolveRouteFill(0, 5)).toBe(0);
    expect(resolveRouteFill(0.5, 5)).toBe(0);
  });

  it('reaches each stop at its center', () => {
    expect(resolveRouteFill(2.5, 5)).toBe(0.5);
  });

  it('is full from the last stop onwards', () => {
    expect(resolveRouteFill(4.5, 5)).toBe(1);
    expect(resolveRouteFill(5, 5)).toBe(1);
  });

  it('is empty for a single stop', () => {
    expect(resolveRouteFill(3, 1)).toBe(0);
  });
});

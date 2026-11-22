import { clamp, smoothstep } from './math';

export type ProgressRange = [start: number, end: number];

export interface PanelWindow {
  enter: ProgressRange | null;
  exit: ProgressRange | null;
}

export const defaultPanelWindow: PanelWindow = {
  enter: [0.04, 0.14],
  exit: [0.86, 0.96],
};

export const stepRange: ProgressRange = [0.14, 0.86];

export const arrivalProgress = 0.3;

export function resolvePresence(localProgress: number, panelWindow: PanelWindow): number {
  const entering = panelWindow.enter
    ? smoothstep(panelWindow.enter[0], panelWindow.enter[1], localProgress)
    : 1;
  const leaving = panelWindow.exit
    ? 1 - smoothstep(panelWindow.exit[0], panelWindow.exit[1], localProgress)
    : 1;
  return Math.min(entering, leaving);
}

export function resolveStepProgress(localProgress: number): number {
  return clamp((localProgress - stepRange[0]) / (stepRange[1] - stepRange[0]), 0, 1);
}

export function resolveActiveStep(stepProgress: number, stepCount: number): number {
  if (stepCount <= 0) {
    return 0;
  }
  return Math.min(Math.floor(stepProgress * stepCount), stepCount - 1);
}

export function resolveStepLocalProgress(stepIndex: number, stepCount: number): number {
  if (stepCount <= 0) {
    return arrivalProgress;
  }
  return stepRange[0] + ((stepIndex + 0.5) / stepCount) * (stepRange[1] - stepRange[0]);
}

export interface StepTarget {
  stagePosition: number;
  stepIndex: number | null;
}

export function resolveStepTarget(
  stagePosition: number,
  activeStep: number,
  stepCounts: number[],
  shift: number,
): StepTarget | null {
  const stepCount = stepCounts[stagePosition] ?? 0;
  const targetStep = activeStep + shift;
  if (stepCount > 0 && targetStep >= 0 && targetStep < stepCount) {
    return { stagePosition, stepIndex: targetStep };
  }
  const targetStage = stagePosition + Math.sign(shift);
  if (shift === 0 || targetStage < 0 || targetStage >= stepCounts.length) {
    return null;
  }
  const targetStepCount = stepCounts[targetStage];
  if (targetStepCount === 0) {
    return { stagePosition: targetStage, stepIndex: null };
  }
  return { stagePosition: targetStage, stepIndex: shift > 0 ? 0 : targetStepCount - 1 };
}

export function resolveRouteFill(journeyPosition: number, stageCount: number): number {
  if (stageCount <= 1) {
    return 0;
  }
  return clamp((journeyPosition - 0.5) / (stageCount - 1), 0, 1);
}

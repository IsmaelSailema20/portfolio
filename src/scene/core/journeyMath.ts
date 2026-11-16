import { clamp } from './math';

export interface SectionMetric {
  top: number;
  height: number;
}

export interface JourneyLocation {
  stageIndex: number;
  localProgress: number;
}

export function resolveJourneyPosition(
  scrollFraction: number,
  sections: SectionMetric[],
  documentHeight: number,
): number {
  const referenceLine = clamp(scrollFraction, 0, 1) * documentHeight;
  let journeyPosition = 0;
  for (const section of sections) {
    if (section.height <= 0) {
      continue;
    }
    journeyPosition += clamp((referenceLine - section.top) / section.height, 0, 1);
  }
  return journeyPosition;
}

export function resolveScrollFraction(
  stageIndex: number,
  localProgress: number,
  sections: SectionMetric[],
  documentHeight: number,
): number {
  const section = sections[stageIndex];
  if (!section || documentHeight <= 0) {
    return 0;
  }
  return clamp((section.top + localProgress * section.height) / documentHeight, 0, 1);
}

export function splitJourneyPosition(journeyPosition: number, stageCount: number): JourneyLocation {
  const stageIndex = clamp(Math.floor(journeyPosition), 0, Math.max(stageCount - 1, 0));
  return { stageIndex, localProgress: journeyPosition - stageIndex };
}

export function resolveWaypointIndex(journeyPosition: number, waypointCounts: number[]): number {
  const totalWaypoints = waypointCounts.reduce((total, count) => total + count, 0);
  if (totalWaypoints === 0) {
    return 0;
  }
  const { stageIndex, localProgress } = splitJourneyPosition(journeyPosition, waypointCounts.length);
  const precedingWaypoints = waypointCounts
    .slice(0, stageIndex)
    .reduce((total, count) => total + count, 0);
  const waypointIndex = precedingWaypoints + localProgress * waypointCounts[stageIndex] - 0.5;
  return clamp(waypointIndex, 0, totalWaypoints - 1);
}

export function resolveCurveParameter(journeyPosition: number, waypointCounts: number[]): number {
  const totalWaypoints = waypointCounts.reduce((total, count) => total + count, 0);
  if (totalWaypoints <= 1) {
    return 0;
  }
  return resolveWaypointIndex(journeyPosition, waypointCounts) / (totalWaypoints - 1);
}

import { describe, expect, it } from 'vitest';
import {
  resolveCurveParameter,
  resolveJourneyPosition,
  resolveScrollFraction,
  resolveWaypointIndex,
  splitJourneyPosition,
} from '../../../src/scene/core/journeyMath';

describe('resolveJourneyPosition', () => {
  const sections = [
    { top: 0, height: 1000 },
    { top: 1000, height: 1000 },
  ];

  it('starts at zero', () => {
    expect(resolveJourneyPosition(0, sections, 2000)).toBe(0);
  });

  it('advances inside the first section', () => {
    expect(resolveJourneyPosition(0.25, sections, 2000)).toBe(0.5);
  });

  it('reaches the second section at its top', () => {
    expect(resolveJourneyPosition(0.5, sections, 2000)).toBe(1);
  });

  it('advances inside the second section', () => {
    expect(resolveJourneyPosition(0.75, sections, 2000)).toBe(1.5);
  });

  it('ends at the section count', () => {
    expect(resolveJourneyPosition(1, sections, 2000)).toBe(2);
  });

  it('ignores scroll fractions outside the document', () => {
    expect(resolveJourneyPosition(2, sections, 2000)).toBe(2);
    expect(resolveJourneyPosition(-1, sections, 2000)).toBe(0);
  });

  it('waits until the reference line reaches an offset section', () => {
    const offsetSections = [{ top: 200, height: 800 }];
    expect(resolveJourneyPosition(0.1, offsetSections, 1000)).toBe(0);
    expect(resolveJourneyPosition(0.6, offsetSections, 1000)).toBe(0.5);
  });

  it('skips sections without height', () => {
    const collapsedSections = [
      { top: 0, height: 0 },
      { top: 0, height: 1000 },
    ];
    expect(resolveJourneyPosition(0.5, collapsedSections, 1000)).toBe(0.5);
  });

  it('returns zero without sections', () => {
    expect(resolveJourneyPosition(0.5, [], 1000)).toBe(0);
  });
});

describe('splitJourneyPosition', () => {
  it('separates the stage index from the local progress', () => {
    expect(splitJourneyPosition(2.25, 5)).toEqual({ stageIndex: 2, localProgress: 0.25 });
  });

  it('keeps the last stage at the end of the journey', () => {
    expect(splitJourneyPosition(5, 5)).toEqual({ stageIndex: 4, localProgress: 1 });
  });

  it('keeps the first stage before the journey starts', () => {
    expect(splitJourneyPosition(-0.5, 5)).toEqual({ stageIndex: 0, localProgress: -0.5 });
  });

  it('falls back to the first stage when there are no stages', () => {
    expect(splitJourneyPosition(1, 0)).toEqual({ stageIndex: 0, localProgress: 1 });
  });
});

describe('resolveWaypointIndex', () => {
  const waypointCounts = [2, 4, 5];

  it('holds the first waypoint at the start', () => {
    expect(resolveWaypointIndex(0, waypointCounts)).toBe(0);
    expect(resolveWaypointIndex(0.25, waypointCounts)).toBe(0);
  });

  it('moves between waypoints inside a stage', () => {
    expect(resolveWaypointIndex(0.5, waypointCounts)).toBe(0.5);
  });

  it('is continuous across stage boundaries', () => {
    expect(resolveWaypointIndex(1, waypointCounts)).toBe(1.5);
  });

  it('accounts for the waypoints of preceding stages', () => {
    expect(resolveWaypointIndex(1.5, waypointCounts)).toBe(3.5);
    expect(resolveWaypointIndex(2.5, waypointCounts)).toBe(8);
  });

  it('holds the last waypoint at the end', () => {
    expect(resolveWaypointIndex(2.95, waypointCounts)).toBe(10);
    expect(resolveWaypointIndex(3, waypointCounts)).toBe(10);
  });

  it('returns zero without waypoints', () => {
    expect(resolveWaypointIndex(1, [])).toBe(0);
  });
});

describe('resolveCurveParameter', () => {
  const waypointCounts = [2, 4, 5];

  it('starts at zero', () => {
    expect(resolveCurveParameter(0, waypointCounts)).toBe(0);
  });

  it('normalizes the waypoint index', () => {
    expect(resolveCurveParameter(2.5, waypointCounts)).toBe(0.8);
  });

  it('ends at one', () => {
    expect(resolveCurveParameter(3, waypointCounts)).toBe(1);
  });

  it('returns zero for a single waypoint', () => {
    expect(resolveCurveParameter(0.5, [1])).toBe(0);
  });

  it('returns zero without waypoints', () => {
    expect(resolveCurveParameter(0.5, [])).toBe(0);
  });
});

describe('resolveScrollFraction', () => {
  const sections = [
    { top: 0, height: 1000 },
    { top: 1000, height: 1000 },
  ];

  it('points at the start of the first section', () => {
    expect(resolveScrollFraction(0, 0, sections, 2000)).toBe(0);
  });

  it('points inside a later section', () => {
    expect(resolveScrollFraction(1, 0.5, sections, 2000)).toBe(0.75);
  });

  it('points at the end of the document', () => {
    expect(resolveScrollFraction(1, 1, sections, 2000)).toBe(1);
  });

  it('stays inside the document', () => {
    expect(resolveScrollFraction(1, 2, sections, 2000)).toBe(1);
    expect(resolveScrollFraction(0, -1, sections, 2000)).toBe(0);
  });

  it('returns zero for an unknown section', () => {
    expect(resolveScrollFraction(5, 0.5, sections, 2000)).toBe(0);
  });

  it('returns zero for an empty document', () => {
    expect(resolveScrollFraction(1, 0.5, sections, 0)).toBe(0);
  });

  it('is the inverse of resolveJourneyPosition', () => {
    const scrollFraction = resolveScrollFraction(1, 0.25, sections, 2000);
    expect(resolveJourneyPosition(scrollFraction, sections, 2000)).toBe(1.25);
  });
});

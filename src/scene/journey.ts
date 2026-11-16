import { CatmullRomCurve3 } from 'three';
import type { Stage, StageFactory, StageOptions } from './core/types';
import { createAsteroidBelt } from './stages/asteroidBelt';
import { createDysonSwarm } from './stages/dysonSwarm';
import { createLaunchBase } from './stages/launchBase';
import { createOrbitalStation } from './stages/orbitalStation';
import { createWormhole } from './stages/wormhole';

const stageFactories: StageFactory[] = [
  createLaunchBase,
  createOrbitalStation,
  createAsteroidBelt,
  createDysonSwarm,
  createWormhole,
];

export interface Journey {
  readonly stages: Stage[];
  readonly route: CatmullRomCurve3;
  readonly waypointCounts: number[];
}

export function createJourney(options: StageOptions): Journey {
  const stages = stageFactories.map((createStage) => createStage(options));
  const route = new CatmullRomCurve3(stages.flatMap((stage) => stage.waypoints));
  const waypointCounts = stages.map((stage) => stage.waypoints.length);
  return { stages, route, waypointCounts };
}

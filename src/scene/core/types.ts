import type { Group, Object3D, Vector3 } from 'three';
import type { StageId } from '../../i18n/ui';
import type { Palette } from './palette';
import type { PanelWindow } from './panelMath';
import type { Quality } from './quality';

export interface SceneContent {
  aboutBlockCount: number;
  skillGroupCount: number;
  experienceCount: number;
  projectCount: number;
}

export interface StageOptions {
  content: SceneContent;
  quality: Quality;
  palette: Palette;
}

export interface StageFrame {
  localProgress: number;
  elapsedTime: number;
  deltaTime: number;
  rocketPosition: Vector3;
}

export interface Stage {
  readonly id: StageId;
  readonly group: Group;
  readonly waypoints: Vector3[];
  readonly cameraOffset: Vector3;
  readonly focusPoint?: Vector3;
  readonly focusWeight?: number;
  readonly pickables?: Object3D[];
  readonly panelWindow?: PanelWindow;
  update(frame: StageFrame): void;
  setHighlight?(itemIndex: number | null): void;
  setStep?(activeStep: number, stepProgress: number): void;
  readItemPosition?(itemIndex: number, target: Vector3): Vector3 | null;
}

export type StageFactory = (options: StageOptions) => Stage;

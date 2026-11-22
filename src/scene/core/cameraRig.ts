import { type PerspectiveCamera, Vector3 } from 'three';
import type { JourneyLocation } from './journeyMath';
import { clamp, dampingFactor, smoothstep } from './math';
import type { Stage } from './types';

export interface CameraFrame {
  location: JourneyLocation;
  rocketPosition: Vector3;
  panelSides: number[];
  viewportWidth: number;
  viewportHeight: number;
  deltaTime: number;
  agility: number;
}

export interface CameraRig {
  update(frame: CameraFrame): void;
  snap(): void;
}

const positionSmoothing = 3.5;
const focusSmoothing = 5;
const handoverStart = 0.72;
const panelShiftFraction = 0.17;
const panelShiftMinimumWidth = 960;
const compactVerticalShiftFraction = 0.2;

export function createCameraRig(camera: PerspectiveCamera, stages: Stage[]): CameraRig {
  const offset = new Vector3();
  const desiredPosition = new Vector3();
  const desiredFocus = new Vector3();
  const focus = new Vector3();
  let hasSnapped = false;

  return {
    update({
      location,
      rocketPosition,
      panelSides,
      viewportWidth,
      viewportHeight,
      deltaTime,
      agility,
    }) {
      const stage = stages[location.stageIndex];
      const nextStage = stages[location.stageIndex + 1] ?? stage;
      const handover = smoothstep(handoverStart, 1, location.localProgress);

      offset.copy(stage.cameraOffset).lerp(nextStage.cameraOffset, handover);
      desiredPosition.copy(rocketPosition).add(offset);

      desiredFocus.copy(rocketPosition);
      if (stage.focusPoint && stage.focusWeight) {
        const presence = Math.sin(Math.PI * clamp(location.localProgress, 0, 1));
        desiredFocus.lerp(stage.focusPoint, stage.focusWeight * presence);
      }

      if (hasSnapped) {
        camera.position.lerp(desiredPosition, dampingFactor(positionSmoothing * agility, deltaTime));
        focus.lerp(desiredFocus, dampingFactor(focusSmoothing * agility, deltaTime));
      } else {
        camera.position.copy(desiredPosition);
        focus.copy(desiredFocus);
        hasSnapped = true;
      }
      camera.lookAt(focus);

      const currentSide = panelSides[location.stageIndex] ?? 0;
      const nextSide = panelSides[location.stageIndex + 1] ?? currentSide;
      const side = currentSide + (nextSide - currentSide) * handover;
      const isWide = viewportWidth >= panelShiftMinimumWidth;
      const horizontalShift = isWide ? side * panelShiftFraction * viewportWidth : 0;
      const verticalShift = isWide ? 0 : compactVerticalShiftFraction * viewportHeight;
      camera.setViewOffset(
        viewportWidth,
        viewportHeight,
        horizontalShift,
        verticalShift,
        viewportWidth,
        viewportHeight,
      );
    },
    snap() {
      hasSnapped = false;
    },
  };
}

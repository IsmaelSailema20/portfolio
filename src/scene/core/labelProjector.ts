import { type PerspectiveCamera, Vector3 } from 'three';
import type { Stage } from './types';

export interface LabelProjector {
  update(viewportWidth: number, viewportHeight: number): void;
  dispose(): void;
}

interface SceneLabel {
  element: HTMLElement;
  stage: Stage;
  itemIndex: number;
}

const labelSelector = '[data-scene-label]';
const visibleDepthLimit = 1;

function collectLabels(stages: Stage[]): SceneLabel[] {
  const labels: SceneLabel[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(labelSelector)) {
    const [stageId, itemIndex] = (element.dataset.sceneLabel ?? '').split(':');
    const stage = stages.find((candidate) => candidate.id === stageId);
    if (stage?.readItemPosition) {
      labels.push({ element, stage, itemIndex: Number(itemIndex) });
    }
  }
  return labels;
}

export function createLabelProjector(camera: PerspectiveCamera, stages: Stage[]): LabelProjector {
  const labels = collectLabels(stages);
  const projected = new Vector3();

  return {
    update(viewportWidth, viewportHeight) {
      for (const label of labels) {
        const position = label.stage.group.visible
          ? (label.stage.readItemPosition?.(label.itemIndex, projected) ?? null)
          : null;
        if (!position) {
          label.element.style.visibility = 'hidden';
          continue;
        }
        position.project(camera);
        if (position.z > visibleDepthLimit) {
          label.element.style.visibility = 'hidden';
          continue;
        }
        const left = (position.x * 0.5 + 0.5) * viewportWidth;
        const top = (-position.y * 0.5 + 0.5) * viewportHeight;
        label.element.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
        label.element.style.visibility = 'visible';
      }
    },
    dispose() {
      for (const label of labels) {
        label.element.style.removeProperty('transform');
        label.element.style.removeProperty('visibility');
      }
    },
  };
}

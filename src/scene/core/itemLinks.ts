import { type PerspectiveCamera, Raycaster, Vector2 } from 'three';
import type { Stage } from './types';

export interface ItemLinks {
  update(): void;
  dispose(): void;
}

interface ItemReference {
  stageId: string;
  itemIndex: number;
}

type PickHandler = (stage: Stage, itemIndex: number) => void;

const itemSelector = '[data-scene-item]';
const blockingSelector = '.panel, .site-header, .site-footer, .scene-label';
const hoverClass = 'has-scene-hover';

function parseItemReference(element: Element | null): ItemReference | null {
  const value = element?.getAttribute('data-scene-item');
  if (!value) {
    return null;
  }
  const [stageId, itemIndex] = value.split(':');
  return { stageId, itemIndex: Number(itemIndex) };
}

function isSameReference(first: ItemReference | null, second: ItemReference | null): boolean {
  return first?.stageId === second?.stageId && first?.itemIndex === second?.itemIndex;
}

function isBlocked(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(blockingSelector) !== null;
}

export function createItemLinks(
  camera: PerspectiveCamera,
  stages: Stage[],
  onPick: PickHandler,
): ItemLinks {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const pickPoint = new Vector2();
  let pointerIsFree = false;
  let pointerHasMoved = false;
  let pageReference: ItemReference | null = null;
  let sceneReference: ItemReference | null = null;

  function applyHighlights(): void {
    const activeReference = pageReference ?? sceneReference;
    for (const stage of stages) {
      stage.setHighlight?.(activeReference?.stageId === stage.id ? activeReference.itemIndex : null);
    }
  }

  function toViewportPoint(clientX: number, clientY: number, target: Vector2): Vector2 {
    return target.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
  }

  function findPick(point: Vector2): { stage: Stage; itemIndex: number } | null {
    raycaster.setFromCamera(point, camera);
    for (const stage of stages) {
      if (!stage.pickables || !stage.group.visible) {
        continue;
      }
      const [hit] = raycaster.intersectObjects(stage.pickables, false);
      if (hit) {
        return { stage, itemIndex: hit.object.userData.itemIndex };
      }
    }
    return null;
  }

  function setSceneReference(reference: ItemReference | null): void {
    if (isSameReference(reference, sceneReference)) {
      return;
    }
    document.documentElement.classList.toggle(hoverClass, reference !== null);
    sceneReference = reference;
    applyHighlights();
  }

  function handlePageHover(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest(itemSelector) : null;
    const reference = parseItemReference(target);
    if (!isSameReference(reference, pageReference)) {
      pageReference = reference;
      applyHighlights();
    }
  }

  function handleFocusOut(): void {
    pageReference = null;
    applyHighlights();
  }

  function handlePointerMove(event: PointerEvent): void {
    toViewportPoint(event.clientX, event.clientY, pointer);
    pointerIsFree = !isBlocked(event.target);
    pointerHasMoved = true;
  }

  function handleClick(event: MouseEvent): void {
    if (isBlocked(event.target)) {
      return;
    }
    const pick = findPick(toViewportPoint(event.clientX, event.clientY, pickPoint));
    if (pick) {
      onPick(pick.stage, pick.itemIndex);
    }
  }

  document.addEventListener('pointerover', handlePageHover);
  document.addEventListener('focusin', handlePageHover);
  document.addEventListener('focusout', handleFocusOut);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('click', handleClick);

  return {
    update() {
      if (!pointerHasMoved) {
        return;
      }
      const pick = pointerIsFree ? findPick(pointer) : null;
      setSceneReference(pick ? { stageId: pick.stage.id, itemIndex: pick.itemIndex } : null);
    },
    dispose() {
      setSceneReference(null);
      document.removeEventListener('pointerover', handlePageHover);
      document.removeEventListener('focusin', handlePageHover);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
    },
  };
}

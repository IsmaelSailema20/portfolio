const selectorSelector = '[data-mission-selector]';
const missionSelector = '[data-mission]';
const tabSelector = '[data-mission-tab]';

function selectMission(missions: HTMLElement[], selectedMission: HTMLElement): void {
  for (const mission of missions) {
    const isSelected = mission === selectedMission;
    mission.classList.toggle('is-selected', isSelected);
    mission.querySelector(tabSelector)?.setAttribute('aria-expanded', String(isSelected));
  }
}

export function initializeMissionSelectors(): void {
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  for (const selector of document.querySelectorAll<HTMLElement>(selectorSelector)) {
    const missions = Array.from(selector.querySelectorAll<HTMLElement>(missionSelector));
    for (const mission of missions) {
      const tab = mission.querySelector<HTMLButtonElement>(tabSelector);
      tab?.addEventListener('click', () => selectMission(missions, mission));
      if (supportsHover) {
        tab?.addEventListener('pointerenter', () => selectMission(missions, mission));
      }
    }
  }
}

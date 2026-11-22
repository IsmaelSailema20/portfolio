export const missionStorageKey = 'portfolio-mission';

const firstMission = 1;

export function parseMissionNumber(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed >= firstMission ? parsed : firstMission;
}

export function formatMissionNumber(missionNumber: number): string {
  return String(missionNumber).padStart(2, '0');
}

export function readMissionNumber(): number {
  try {
    return parseMissionNumber(localStorage.getItem(missionStorageKey));
  } catch {
    return firstMission;
  }
}

export function renderMissionNumber(missionNumber: number): void {
  for (const element of document.querySelectorAll('[data-mission-number]')) {
    element.textContent = formatMissionNumber(missionNumber);
  }
}

export function advanceMission(): number {
  const nextMission = readMissionNumber() + 1;
  try {
    localStorage.setItem(missionStorageKey, String(nextMission));
  } catch {
    return nextMission;
  } finally {
    renderMissionNumber(nextMission);
  }
  return nextMission;
}

const magneticSelector = '[data-magnetic]';
const pullStrength = 0.22;
const maximumPull = 10;

function limitPull(distance: number): number {
  return Math.min(Math.max(distance * pullStrength, -maximumPull), maximumPull);
}

export function initializeMagneticElements(): void {
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsHover || prefersReducedMotion) {
    return;
  }

  for (const element of document.querySelectorAll<HTMLElement>(magneticSelector)) {
    element.addEventListener('pointermove', (event) => {
      const bounds = element.getBoundingClientRect();
      const horizontalDistance = event.clientX - (bounds.left + bounds.width / 2);
      const verticalDistance = event.clientY - (bounds.top + bounds.height / 2);
      element.style.setProperty('--magnet-x', `${limitPull(horizontalDistance)}px`);
      element.style.setProperty('--magnet-y', `${limitPull(verticalDistance)}px`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--magnet-x');
      element.style.removeProperty('--magnet-y');
    });
  }
}

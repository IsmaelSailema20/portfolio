const toggleSelector = '[data-detail-toggle]';

export function initializeDetailToggles(): void {
  for (const toggle of document.querySelectorAll<HTMLButtonElement>(toggleSelector)) {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(isExpanded));
      toggle.closest('[data-step]')?.classList.toggle('is-expanded', isExpanded);
    });
  }
}

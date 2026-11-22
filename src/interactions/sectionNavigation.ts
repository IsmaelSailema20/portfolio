const sectionSelector = '.stage[id]';
const navigationLinkSelector = '[data-section-link]';
const markerRatio = 0.35;
const bottomTolerance = 2;

export function resolveActiveSection(
  sectionTops: number[],
  markerPosition: number,
  isAtBottom: boolean,
): number {
  if (isAtBottom) {
    return sectionTops.length - 1;
  }
  return sectionTops.findLastIndex((sectionTop) => sectionTop <= markerPosition);
}

export function initializeSectionNavigation(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(sectionSelector));
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(navigationLinkSelector));
  if (sections.length === 0 || links.length === 0) {
    return;
  }
  let isScheduled = false;

  function markActiveSection(): void {
    isScheduled = false;
    const scrollBottom = window.scrollY + window.innerHeight;
    const activeIndex = resolveActiveSection(
      sections.map((section) => section.getBoundingClientRect().top),
      window.innerHeight * markerRatio,
      scrollBottom >= document.documentElement.scrollHeight - bottomTolerance,
    );
    const activeId = sections[activeIndex]?.id;
    for (const link of links) {
      const isCurrent = link.dataset.sectionLink === activeId;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function scheduleUpdate(): void {
    if (!isScheduled) {
      isScheduled = true;
      requestAnimationFrame(markActiveSection);
    }
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  markActiveSection();
}

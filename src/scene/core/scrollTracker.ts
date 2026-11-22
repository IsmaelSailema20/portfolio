import { resolveJourneyPosition, resolveScrollFraction, type SectionMetric } from './journeyMath';

export interface ScrollTracker {
  readJourneyPosition(): number;
  resolveScrollTop(stageIndex: number, localProgress: number): number;
  dispose(): void;
}

export function createScrollTracker(sections: HTMLElement[]): ScrollTracker {
  let metrics: SectionMetric[] = [];
  let documentHeight = 1;

  function measure(): void {
    documentHeight = document.documentElement.scrollHeight;
    metrics = sections.map((section) => {
      const bounds = section.getBoundingClientRect();
      return { top: bounds.top + window.scrollY, height: bounds.height };
    });
  }

  function readMaximumScroll(): number {
    return Math.max(documentHeight - window.innerHeight, 0);
  }

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(document.body);
  window.addEventListener('resize', measure);
  measure();

  return {
    readJourneyPosition() {
      const maximumScroll = readMaximumScroll();
      const scrollFraction = maximumScroll > 0 ? window.scrollY / maximumScroll : 0;
      return resolveJourneyPosition(scrollFraction, metrics, documentHeight);
    },
    resolveScrollTop(stageIndex, localProgress) {
      return (
        resolveScrollFraction(stageIndex, localProgress, metrics, documentHeight) *
        readMaximumScroll()
      );
    },
    dispose() {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    },
  };
}

const gallerySelector = '[data-gallery]';
const slideSelector = '[data-gallery-slide]';
const captionSelector = '[data-gallery-caption]';
const targetSelector = '[data-gallery-target]';
const shiftSelector = '[data-gallery-shift]';
const counterSelector = '[data-gallery-counter]';
const swipeThreshold = 40;
const slideShiftKeys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

export function wrapSlideIndex(slideIndex: number, slideCount: number): number {
  return ((slideIndex % slideCount) + slideCount) % slideCount;
}

export function resolveSwipeShift(
  horizontalDistance: number,
  verticalDistance: number,
  threshold: number,
): number {
  const isHorizontal = Math.abs(horizontalDistance) > Math.abs(verticalDistance);
  if (!isHorizontal || Math.abs(horizontalDistance) < threshold) {
    return 0;
  }
  return horizontalDistance < 0 ? 1 : -1;
}

export function formatSlideCounter(slideIndex: number, slideCount: number): string {
  const padNumber = (value: number) => String(value).padStart(2, '0');
  return `${padNumber(slideIndex + 1)} / ${padNumber(slideCount)}`;
}

function showSlide(gallery: HTMLElement, slideIndex: number): void {
  const slides = gallery.querySelectorAll<HTMLElement>(slideSelector);
  gallery.dataset.slideIndex = String(slideIndex);
  gallery.style.setProperty('--slide-index', String(slideIndex));
  slides.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== slideIndex)));
  gallery.querySelectorAll<HTMLElement>(captionSelector).forEach((caption, index) => {
    caption.hidden = index !== slideIndex;
  });
  gallery.querySelectorAll<HTMLElement>(targetSelector).forEach((target, index) => {
    const isCurrent = index === slideIndex;
    target.classList.toggle('is-current', isCurrent);
    if (isCurrent) {
      target.setAttribute('aria-current', 'true');
    } else {
      target.removeAttribute('aria-current');
    }
  });
  const counter = gallery.querySelector(counterSelector);
  if (counter) {
    counter.textContent = formatSlideCounter(slideIndex, slides.length);
  }
}

function shiftSlide(gallery: HTMLElement, shift: number): void {
  const slideCount = gallery.querySelectorAll(slideSelector).length;
  const currentIndex = Number(gallery.dataset.slideIndex ?? 0);
  showSlide(gallery, wrapSlideIndex(currentIndex + shift, slideCount));
}

function initializeGallery(gallery: HTMLElement): void {
  let swipeStart: { x: number; y: number } | null = null;

  gallery.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const shiftControl = event.target.closest<HTMLElement>(shiftSelector);
    const targetControl = event.target.closest<HTMLElement>(targetSelector);
    if (shiftControl) {
      shiftSlide(gallery, Number(shiftControl.dataset.galleryShift));
    } else if (targetControl) {
      showSlide(gallery, Number(targetControl.dataset.galleryTarget));
    }
  });

  gallery.addEventListener('keydown', (event) => {
    const shift = slideShiftKeys[event.code];
    if (shift !== undefined) {
      event.preventDefault();
      shiftSlide(gallery, shift);
    }
  });

  gallery.addEventListener('pointerdown', (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
  });

  gallery.addEventListener('pointerup', (event) => {
    if (swipeStart === null) {
      return;
    }
    const shift = resolveSwipeShift(
      event.clientX - swipeStart.x,
      event.clientY - swipeStart.y,
      swipeThreshold,
    );
    swipeStart = null;
    if (shift !== 0) {
      shiftSlide(gallery, shift);
    }
  });

  gallery.addEventListener('pointercancel', () => {
    swipeStart = null;
  });
}

export function initializeProjectGalleries(): void {
  for (const gallery of document.querySelectorAll<HTMLElement>(gallerySelector)) {
    initializeGallery(gallery);
  }
}

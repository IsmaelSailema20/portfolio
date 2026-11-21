import type { ModeController } from './modeController';

function triggerDownload(source: HTMLAnchorElement): void {
  const temporaryLink = document.createElement('a');
  temporaryLink.href = source.href;
  temporaryLink.download = source.download;
  document.body.append(temporaryLink);
  temporaryLink.click();
  temporaryLink.remove();
}

function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initializeWarpLinks(modeController: ModeController): void {
  let isBusy = false;

  function bindFlash(selector: string, complete: (link: HTMLAnchorElement) => void): void {
    for (const link of document.querySelectorAll<HTMLAnchorElement>(selector)) {
      link.addEventListener('click', async (event) => {
        const sceneHandle = modeController.readSceneHandle();
        if (!sceneHandle || !isPlainClick(event) || prefersReducedMotion()) {
          return;
        }
        event.preventDefault();
        if (isBusy) {
          return;
        }
        isBusy = true;
        await sceneHandle.playFlash();
        complete(link);
        isBusy = false;
      });
    }
  }

  bindFlash('[data-curriculum-link]', triggerDownload);
  bindFlash('[data-warp-link]', (link) => window.location.assign(link.href));

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-wormhole-jump]')) {
    button.addEventListener('click', async () => {
      const sceneHandle = modeController.readSceneHandle();
      if (!sceneHandle || prefersReducedMotion()) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
        return;
      }
      if (isBusy) {
        return;
      }
      isBusy = true;
      await sceneHandle.playJump();
      isBusy = false;
    });
  }
}

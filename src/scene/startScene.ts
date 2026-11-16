import gsap from 'gsap';
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { Locale } from '../i18n/locales';
import { advanceMission } from '../interactions/mission';
import type { AsteroidRun } from '../minigame/asteroidRun';
import { createExhaust } from './actors/exhaust';
import { createRocket } from './actors/rocket';
import { createStarfield } from './actors/starfield';
import { createWarpTunnel } from './actors/warpTunnel';
import { createCameraRig } from './core/cameraRig';
import { disposeObject } from './core/dispose';
import { createItemLinks } from './core/itemLinks';
import { resolveCurveParameter, splitJourneyPosition } from './core/journeyMath';
import { createLabelProjector } from './core/labelProjector';
import { createLighting } from './core/lighting';
import { clamp, damp, dampingFactor } from './core/math';
import { readPalette } from './core/palette';
import {
  arrivalProgress,
  defaultPanelWindow,
  resolveActiveStep,
  resolvePresence,
  resolveRouteFill,
  resolveStepLocalProgress,
  resolveStepProgress,
} from './core/panelMath';
import { readDeviceProfile, resolveQuality } from './core/quality';
import { createScrollTracker } from './core/scrollTracker';
import {
  formatDistance,
  formatMissionClock,
  resolveDistanceKilometers,
  resolveMissionSeconds,
} from './core/telemetry';
import type { SceneContent, Stage } from './core/types';
import { createJourney } from './journey';
import { wormholeAnchor } from './stages/wormhole';

export interface SceneHandle {
  playFlash(): Promise<void>;
  playJump(): Promise<void>;
  dispose(): void;
}

const baseFieldOfView = 55;
const warpFieldOfViewGain = 50;
const flashTravelDistance = 42;
const jumpTravelDistance = 95;
const journeySmoothing = 4;
const jumpCameraAgility = 4;
const rewindSeconds = 3;
const steeringRecovery = 5;
const stageVisibilityRange = 1.75;
const maximumDeltaTime = 0.05;
const directionThreshold = 0.004;
const thrustPerVelocity = 2.4;
const idleThrust = 0.14;
const manualControlThrust = 0.6;
const awayPresence = 0.05;
const presencePrecision = 0.005;
const flightSecondsPerViewport = 1.1;
const minimumFlightSeconds = 0.8;
const maximumFlightSeconds = 7;
const interactiveElements = 'a, button, input, textarea, select';
const flightCancelEvents = ['wheel', 'touchstart', 'keydown'] as const;

const panelSideValues: Record<string, number> = { left: -1, right: 1 };

interface StageSection {
  element: HTMLElement;
  steps: HTMLElement[];
  presence: number;
  activeStep: number;
}

function countSceneItems(stageId: string): number {
  const section = document.querySelector<HTMLElement>(`[data-stage="${stageId}"]`);
  return Number(section?.dataset.itemCount ?? 0);
}

function readProjectImages(): (string | null)[] {
  const projectSteps = document.querySelectorAll('[data-stage="projects"] [data-step]');
  return Array.from(projectSteps, (step) => step.querySelector('img')?.currentSrc || step.querySelector('img')?.src || null);
}

function readSceneContent(): SceneContent {
  return {
    projectImages: readProjectImages(),
    skillGroupCount: countSceneItems('about'),
    experienceCount: countSceneItems('experience'),
    projectCount: countSceneItems('projects'),
  };
}

function findStageSection(stage: Stage): StageSection {
  const element = document.querySelector<HTMLElement>(`[data-stage="${stage.id}"]`);
  if (!element) {
    throw new Error(`Missing section for stage: ${stage.id}`);
  }
  return {
    element,
    steps: Array.from(element.querySelectorAll<HTMLElement>('[data-step]')),
    presence: -1,
    activeStep: -1,
  };
}

function setText(element: Element | null, text: string): void {
  if (element && element.textContent !== text) {
    element.textContent = text;
  }
}

export function startScene(canvas: HTMLCanvasElement): SceneHandle {
  const root = document.documentElement;
  const locale: Locale = root.lang === 'en' ? 'en' : 'es';
  const palette = readPalette();
  const quality = resolveQuality(readDeviceProfile());

  const renderer = new WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatioLimit));
  renderer.setClearColor(palette.color('void'));

  const scene = new Scene();
  const camera = new PerspectiveCamera(baseFieldOfView, 1, 0.3, 3500);

  const { stages, route, waypointCounts } = createJourney({
    content: readSceneContent(),
    quality,
    palette,
  });
  const sections = stages.map(findStageSection);
  const panelSides = sections.map(
    (section) => panelSideValues[section.element.dataset.side ?? ''] ?? 0,
  );
  const manualControlStage = stages.findIndex((stage) => stage.id === 'experience');

  const rocket = createRocket(palette);
  const exhaust = createExhaust(palette, quality);
  const starfield = createStarfield(quality);
  scene.add(
    createLighting(palette),
    starfield.group,
    rocket.group,
    exhaust.points,
    ...stages.map((stage) => stage.group),
  );

  const warpTunnel = createWarpTunnel(palette);
  scene.add(warpTunnel.mesh);

  const cameraRig = createCameraRig(camera, stages);
  const scrollTracker = createScrollTracker(sections.map((section) => section.element));
  const labelProjector = createLabelProjector(camera, stages);
  const itemLinks = createItemLinks(camera, stages, (stage, itemIndex) => {
    const stagePosition = stages.indexOf(stage);
    const stepCount = sections[stagePosition].steps.length;
    if (stepCount > 0) {
      flyTo(stagePosition, resolveStepLocalProgress(itemIndex, stepCount));
    }
  });

  const warpFlash = document.querySelector<HTMLElement>('[data-warp-flash]');
  const routeStops = Array.from(document.querySelectorAll<HTMLElement>('[data-route-stop]'));
  const routeCurrentLabel = document.querySelector('[data-route-current]');
  const clockLabel = document.querySelector('[data-telemetry-clock]');
  const distanceLabel = document.querySelector('[data-telemetry-distance]');

  const basePosition = new Vector3();
  const tangent = new Vector3();
  const heading = new Vector3(0, 1, 0);
  const rocketPosition = new Vector3();
  const tailPosition = new Vector3();
  const currentHeading = new Vector3();
  const steeringOffset = new Vector3();
  const warpDirection = new Vector3();
  const warp = { value: 0 };
  const flash = { value: 0 };
  const plunge = { value: 0 };
  const tunnel = { value: 0 };
  const rewind = { top: 0 };
  const flight = { top: 0 };

  let journeyPosition = scrollTracker.readJourneyPosition();
  let stageIndex = -1;
  let travelDirection = 1;
  let warpTravelDistance = flashTravelDistance;
  let previousTime: number | null = null;
  let elapsedTime = 0;
  let asteroidRun: AsteroidRun | null = null;
  let isLoadingRun = false;
  let isJumping = false;
  let warpTimeline: gsap.core.Timeline | null = null;
  let flightTween: gsap.core.Tween | null = null;
  let viewportWidth = 1;
  let viewportHeight = 1;

  for (const section of sections) {
    section.element.classList.toggle('is-stepping', section.steps.length > 0);
  }

  function resize(): void {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();
  }

  function cancelFlight(): void {
    flightTween?.kill();
    flightTween = null;
  }

  function flyTo(stagePosition: number, localProgress: number): void {
    if (isJumping) {
      return;
    }
    cancelFlight();
    const targetTop = scrollTracker.resolveScrollTop(stagePosition, localProgress);
    const distanceInViewports = Math.abs(targetTop - window.scrollY) / viewportHeight;
    flight.top = window.scrollY;
    flightTween = gsap.to(flight, {
      top: targetTop,
      duration: clamp(
        distanceInViewports * flightSecondsPerViewport,
        minimumFlightSeconds,
        maximumFlightSeconds,
      ),
      ease: 'power2.inOut',
      onUpdate: () => window.scrollTo({ top: flight.top, behavior: 'instant' }),
    });
  }

  function flyToStage(stagePosition: number): void {
    const stepCount = sections[stagePosition].steps.length;
    const localProgress =
      stagePosition === 0
        ? 0
        : stepCount > 0
          ? resolveStepLocalProgress(0, stepCount)
          : arrivalProgress;
    flyTo(stagePosition, localProgress);
  }

  function handleNavigationClick(event: MouseEvent): void {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;
    const stagePosition = stages.findIndex((stage) => `#${stage.id}` === link?.getAttribute('href'));
    if (stagePosition >= 0) {
      event.preventDefault();
      flyToStage(stagePosition);
    }
  }

  function endAsteroidRun(): void {
    asteroidRun?.dispose();
    asteroidRun = null;
  }

  async function beginAsteroidRun(): Promise<void> {
    isLoadingRun = true;
    const { createAsteroidRun } = await import('../minigame/asteroidRun');
    asteroidRun = createAsteroidRun({ scene, palette });
    isLoadingRun = false;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const isOnControl =
      event.target instanceof Element && event.target.closest(interactiveElements) !== null;
    const canStart =
      event.code === 'Space' &&
      !isOnControl &&
      !asteroidRun &&
      !isLoadingRun &&
      !isJumping &&
      stageIndex === manualControlStage;
    if (canStart) {
      event.preventDefault();
      void beginAsteroidRun();
    }
  }

  function updateSections(): void {
    stages.forEach((stage, stagePosition) => {
      const section = sections[stagePosition];
      const localProgress = journeyPosition - stagePosition;

      const presence = resolvePresence(localProgress, stage.panelWindow ?? defaultPanelWindow);
      const hasSettled = presence === 0 || presence === 1;
      const hasMoved = Math.abs(presence - section.presence) > presencePrecision;
      if (presence !== section.presence && (hasMoved || hasSettled)) {
        section.presence = presence;
        section.element.style.setProperty('--presence', presence.toFixed(3));
        section.element.classList.toggle('is-away', presence < awayPresence);
      }

      if (section.steps.length === 0) {
        return;
      }
      const stepProgress = resolveStepProgress(localProgress);
      const activeStep = resolveActiveStep(stepProgress, section.steps.length);
      stage.setStep?.(activeStep, stepProgress);
      if (activeStep !== section.activeStep) {
        section.activeStep = activeStep;
        section.steps.forEach((step, stepIndex) => {
          step.classList.toggle('is-current', stepIndex === activeStep);
        });
      }
    });
  }

  function updateRouteMap(): void {
    routeStops.forEach((stop, stopIndex) => {
      const isCurrent = stopIndex === stageIndex;
      if (isCurrent) {
        stop.setAttribute('aria-current', 'step');
        setText(routeCurrentLabel, stop.dataset.label ?? '');
      } else {
        stop.removeAttribute('aria-current');
      }
      stop.classList.toggle('is-visited', stopIndex < stageIndex);
    });
  }

  function updateTelemetry(): void {
    setText(clockLabel, formatMissionClock(resolveMissionSeconds(journeyPosition, stages.length)));
    setText(distanceLabel, formatDistance(resolveDistanceKilometers(journeyPosition), locale));
  }

  function renderFrame(time: number): void {
    const deltaTime =
      previousTime === null ? 0 : Math.min((time - previousTime) / 1000, maximumDeltaTime);
    previousTime = time;
    elapsedTime += deltaTime;

    const previousPosition = journeyPosition;
    journeyPosition = damp(
      journeyPosition,
      scrollTracker.readJourneyPosition(),
      journeySmoothing,
      deltaTime,
    );
    const velocity = deltaTime > 0 ? (journeyPosition - previousPosition) / deltaTime : 0;
    const location = splitJourneyPosition(journeyPosition, stages.length);
    const curveParameter = resolveCurveParameter(journeyPosition, waypointCounts);
    const hasChangedStage = location.stageIndex !== stageIndex;
    stageIndex = location.stageIndex;

    route.getPoint(curveParameter, basePosition);
    route.getTangent(curveParameter, tangent);

    if (Math.abs(velocity) > directionThreshold) {
      travelDirection = velocity > 0 ? 1 : -1;
    }
    if (stageIndex === 0 || asteroidRun) {
      travelDirection = 1;
    }
    heading.copy(tangent).multiplyScalar(travelDirection);

    if (asteroidRun) {
      const isRunning = asteroidRun.update(deltaTime, basePosition);
      steeringOffset.copy(asteroidRun.offset);
      if (!isRunning) {
        endAsteroidRun();
      }
    } else {
      steeringOffset.multiplyScalar(1 - dampingFactor(steeringRecovery, deltaTime));
    }

    warpDirection.copy(wormholeAnchor).sub(basePosition).normalize();
    rocketPosition
      .copy(basePosition)
      .add(steeringOffset)
      .addScaledVector(warpDirection, plunge.value * plunge.value * warpTravelDistance);
    rocket.update(rocketPosition, heading, deltaTime);

    const thrust = Math.max(
      clamp(Math.abs(velocity) * thrustPerVelocity, 0, 1),
      curveParameter > 0 ? idleThrust : 0,
      asteroidRun ? manualControlThrust : 0,
      warp.value,
    );
    exhaust.update(
      deltaTime,
      rocket.readTailPosition(tailPosition),
      rocket.readHeading(currentHeading),
      thrust,
    );

    camera.fov = baseFieldOfView + warp.value * warpFieldOfViewGain;
    cameraRig.update({
      location,
      rocketPosition: basePosition,
      panelSides,
      viewportWidth,
      viewportHeight,
      deltaTime,
      agility: isJumping ? jumpCameraAgility : 1,
    });

    stages.forEach((stage, stagePosition) => {
      stage.group.visible =
        Math.abs(journeyPosition - (stagePosition + 0.5)) < stageVisibilityRange;
      if (stage.group.visible) {
        stage.update({
          localProgress: journeyPosition - stagePosition,
          elapsedTime,
          deltaTime,
          rocketPosition,
        });
      }
    });

    updateSections();
    if (hasChangedStage) {
      updateRouteMap();
    }
    root.style.setProperty(
      '--route-fill',
      resolveRouteFill(journeyPosition, stages.length).toFixed(4),
    );
    updateTelemetry();

    starfield.update(camera.position);
    warpTunnel.update(elapsedTime, tunnel.value, viewportWidth / viewportHeight);
    itemLinks.update();
    if (warpFlash) {
      warpFlash.style.opacity = flash.value.toFixed(3);
    }
    renderer.render(scene, camera);
    labelProjector.update(viewportWidth, viewportHeight);
  }

  function handleVisibilityChange(): void {
    previousTime = null;
    renderer.setAnimationLoop(document.hidden ? null : renderFrame);
  }

  function rewindScroll(): void {
    window.scrollTo({ top: rewind.top, behavior: 'instant' });
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleNavigationClick);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  for (const eventName of flightCancelEvents) {
    window.addEventListener(eventName, cancelFlight, { passive: true });
  }
  renderer.setAnimationLoop(renderFrame);

  return {
    playFlash() {
      return new Promise<void>((resolve) => {
        if (isJumping) {
          resolve();
          return;
        }
        warpTimeline?.kill();
        warpTravelDistance = flashTravelDistance;
        warpTimeline = gsap
          .timeline()
          .to([warp, plunge], { value: 0.55, duration: 0.5, ease: 'power2.in' }, 0)
          .to(flash, { value: 0.85, duration: 0.5, ease: 'power2.in' }, 0)
          .call(() => resolve())
          .to([warp, plunge, flash], { value: 0, duration: 0.7, ease: 'power2.out' }, '>');
      });
    },
    playJump() {
      return new Promise<void>((resolve) => {
        if (isJumping) {
          resolve();
          return;
        }
        isJumping = true;
        cancelFlight();
        endAsteroidRun();
        warpTimeline?.kill();
        warpTravelDistance = jumpTravelDistance;
        rewind.top = window.scrollY;
        root.classList.add('is-jumping');
        warpTimeline = gsap
          .timeline()
          .to([warp, plunge], { value: 1, duration: 1.2, ease: 'power2.in' }, 0)
          .to(tunnel, { value: 1, duration: 0.6, ease: 'power1.in' }, 0.7)
          .to(flash, { value: 0.5, duration: 0.25, ease: 'power1.in' }, 0.95)
          .set(plunge, { value: 0 }, 1.2)
          .to(flash, { value: 0, duration: 0.5, ease: 'power1.out' }, 1.2)
          .to(warp, { value: 0.6, duration: 0.5, ease: 'power1.out' }, 1.2)
          .to(rewind, { top: 0, duration: rewindSeconds, ease: 'power1.inOut', onUpdate: rewindScroll }, 1.2)
          .to([warp, tunnel], { value: 0, duration: 1, ease: 'power2.out' }, 1.2 + rewindSeconds - 0.5)
          .call(() => {
            advanceMission();
            isJumping = false;
            root.classList.remove('is-jumping');
            resolve();
          });
      });
    },
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleNavigationClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      for (const eventName of flightCancelEvents) {
        window.removeEventListener(eventName, cancelFlight);
      }
      cancelFlight();
      warpTimeline?.kill();
      endAsteroidRun();
      scrollTracker.dispose();
      itemLinks.dispose();
      labelProjector.dispose();

      for (const section of sections) {
        section.element.style.removeProperty('--presence');
        section.element.classList.remove('is-stepping', 'is-away');
        for (const step of section.steps) {
          step.classList.remove('is-current');
        }
      }
      for (const stop of routeStops) {
        stop.removeAttribute('aria-current');
        stop.classList.remove('is-visited');
      }
      root.style.removeProperty('--route-fill');
      root.classList.remove('is-jumping');
      if (warpFlash) {
        warpFlash.style.opacity = '';
      }
      disposeObject(scene);
      renderer.dispose();
    },
  };
}

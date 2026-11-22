import { describe, expect, it } from 'vitest';
import {
  formatSlideCounter,
  resolveSwipeShift,
  wrapSlideIndex,
} from '../../src/interactions/projectGallery';

describe('wrapSlideIndex', () => {
  it('keeps indexes inside the range', () => {
    expect(wrapSlideIndex(0, 4)).toBe(0);
    expect(wrapSlideIndex(3, 4)).toBe(3);
  });

  it('goes back to the first slide after the last one', () => {
    expect(wrapSlideIndex(4, 4)).toBe(0);
    expect(wrapSlideIndex(9, 4)).toBe(1);
  });

  it('goes to the last slide before the first one', () => {
    expect(wrapSlideIndex(-1, 4)).toBe(3);
    expect(wrapSlideIndex(-5, 4)).toBe(3);
  });
});

describe('resolveSwipeShift', () => {
  it('moves forward when swiping to the left', () => {
    expect(resolveSwipeShift(-60, 10, 40)).toBe(1);
  });

  it('moves back when swiping to the right', () => {
    expect(resolveSwipeShift(60, -10, 40)).toBe(-1);
  });

  it('accepts a swipe exactly at the threshold', () => {
    expect(resolveSwipeShift(-40, 0, 40)).toBe(1);
    expect(resolveSwipeShift(40, 0, 40)).toBe(-1);
  });

  it('ignores swipes shorter than the threshold', () => {
    expect(resolveSwipeShift(-39, 0, 40)).toBe(0);
    expect(resolveSwipeShift(39, 0, 40)).toBe(0);
  });

  it('ignores mostly vertical gestures', () => {
    expect(resolveSwipeShift(-60, 80, 40)).toBe(0);
    expect(resolveSwipeShift(60, -60, 40)).toBe(0);
  });
});

describe('formatSlideCounter', () => {
  it('shows the slide position over the total', () => {
    expect(formatSlideCounter(0, 4)).toBe('01 / 04');
    expect(formatSlideCounter(2, 3)).toBe('03 / 03');
  });

  it('keeps numbers with two digits', () => {
    expect(formatSlideCounter(11, 12)).toBe('12 / 12');
  });
});

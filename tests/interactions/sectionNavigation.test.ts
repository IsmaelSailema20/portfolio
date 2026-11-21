import { describe, expect, it } from 'vitest';
import { resolveActiveSection } from '../../src/interactions/sectionNavigation';

describe('resolveActiveSection', () => {
  it('picks the last section whose top passed the marker', () => {
    expect(resolveActiveSection([-900, -100, 200, 1200], 300, false)).toBe(2);
  });

  it('includes a section whose top is exactly on the marker', () => {
    expect(resolveActiveSection([-900, 300, 1200], 300, false)).toBe(1);
  });

  it('keeps the previous section while the next one is below the marker', () => {
    expect(resolveActiveSection([-900, 301, 1200], 300, false)).toBe(0);
  });

  it('returns no section when none reached the marker', () => {
    expect(resolveActiveSection([400, 1200], 300, false)).toBe(-1);
  });

  it('picks the last section at the bottom of the page', () => {
    expect(resolveActiveSection([-2000, -900, 500], 300, true)).toBe(2);
  });
});

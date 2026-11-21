import { siOpenjdk, siReact, siSpringboot } from 'simple-icons';
import { describe, expect, it } from 'vitest';
import { formatMonogram, resolveTechnologyIcon } from '../../../src/components/ui/technologyIcons';

describe('resolveTechnologyIcon', () => {
  it('finds the brand icon of a known technology', () => {
    expect(resolveTechnologyIcon('React')).toBe(siReact);
    expect(resolveTechnologyIcon('Spring Boot')).toBe(siSpringboot);
  });

  it('reuses related brands for technologies without their own icon', () => {
    expect(resolveTechnologyIcon('Java')).toBe(siOpenjdk);
    expect(resolveTechnologyIcon('React Native')).toBe(siReact);
  });

  it('returns null for technologies without an icon', () => {
    expect(resolveTechnologyIcon('gRPC')).toBeNull();
    expect(resolveTechnologyIcon('OAuth2')).toBeNull();
  });

  it('matches names exactly', () => {
    expect(resolveTechnologyIcon('react')).toBeNull();
  });
});

describe('formatMonogram', () => {
  it('uses the first two letters of a single word', () => {
    expect(formatMonogram('gRPC')).toBe('GR');
    expect(formatMonogram('OAuth2')).toBe('OA');
  });

  it('uses the initials of the first two words', () => {
    expect(formatMonogram('AWS SES')).toBe('AS');
    expect(formatMonogram('Spring Cloud Gateway')).toBe('SC');
  });

  it('ignores surrounding and repeated spaces', () => {
    expect(formatMonogram('  WebSockets  ')).toBe('WE');
    expect(formatMonogram('AWS   SES')).toBe('AS');
  });
});

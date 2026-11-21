import { describe, expect, it } from 'vitest';
import { buildMailtoUrl, composeMessageBody } from '../../src/interactions/contactForm';

describe('composeMessageBody', () => {
  it('signs the message with the sender name', () => {
    expect(composeMessageBody({ name: 'Ana', subject: 'Hola', message: 'Me interesa tu perfil' })).toBe(
      'Me interesa tu perfil\n\nAna',
    );
  });

  it('trims the message and the name', () => {
    expect(composeMessageBody({ name: '  Ana  ', subject: '', message: '  Hola  ' })).toBe('Hola\n\nAna');
  });

  it('leaves the message unsigned without a name', () => {
    expect(composeMessageBody({ name: '', subject: '', message: 'Hola' })).toBe('Hola');
    expect(composeMessageBody({ name: '   ', subject: '', message: 'Hola' })).toBe('Hola');
  });
});

describe('buildMailtoUrl', () => {
  it('addresses the recipient with the subject and the signed body', () => {
    expect(
      buildMailtoUrl('ismael@example.com', { name: 'Ana', subject: 'Oferta', message: 'Hola' }),
    ).toBe('mailto:ismael@example.com?subject=Oferta&body=Hola%0A%0AAna');
  });

  it('encodes spaces and reserved characters instead of using plus signs', () => {
    expect(
      buildMailtoUrl('ismael@example.com', {
        name: '',
        subject: 'Proyecto & equipo',
        message: '¿Hablamos? 50% listo',
      }),
    ).toBe(
      'mailto:ismael@example.com?subject=Proyecto%20%26%20equipo&body=%C2%BFHablamos%3F%2050%25%20listo',
    );
  });

  it('trims the subject', () => {
    expect(buildMailtoUrl('ismael@example.com', { name: '', subject: '  Hola  ', message: 'Hola' })).toBe(
      'mailto:ismael@example.com?subject=Hola&body=Hola',
    );
  });
});

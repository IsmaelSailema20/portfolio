import { describe, expect, it } from 'vitest';
import { buildContactSubmission, isSuccessfulSubmission } from '../../src/interactions/contactForm';

describe('buildContactSubmission', () => {
  it('includes the access key, the sender label and the message fields', () => {
    expect(
      buildContactSubmission(
        'access-key',
        { name: 'Ana', email: 'ana@example.com', subject: 'Oferta', message: 'Hola' },
        false,
      ),
    ).toEqual({
      access_key: 'access-key',
      from_name: 'Portafolio',
      name: 'Ana',
      email: 'ana@example.com',
      subject: 'Oferta',
      message: 'Hola',
      botcheck: false,
    });
  });

  it('trims every field', () => {
    expect(
      buildContactSubmission(
        'access-key',
        { name: '  Ana  ', email: ' ana@example.com ', subject: '  Oferta ', message: '\n Hola \n' },
        false,
      ),
    ).toMatchObject({ name: 'Ana', email: 'ana@example.com', subject: 'Oferta', message: 'Hola' });
  });

  it('flags submissions that filled the bot trap', () => {
    expect(
      buildContactSubmission('access-key', { name: '', email: '', subject: '', message: '' }, true)
        .botcheck,
    ).toBe(true);
  });
});

describe('isSuccessfulSubmission', () => {
  it('accepts a successful response', () => {
    expect(isSuccessfulSubmission({ success: true, message: 'Email sent successfully!' })).toBe(true);
  });

  it('rejects a failed response', () => {
    expect(isSuccessfulSubmission({ success: false, message: 'Invalid access key' })).toBe(false);
  });

  it('rejects a success flag that is not a boolean', () => {
    expect(isSuccessfulSubmission({ success: 'true' })).toBe(false);
    expect(isSuccessfulSubmission({ success: 1 })).toBe(false);
  });

  it('rejects responses without a success flag', () => {
    expect(isSuccessfulSubmission({})).toBe(false);
    expect(isSuccessfulSubmission(null)).toBe(false);
    expect(isSuccessfulSubmission(true)).toBe(false);
    expect(isSuccessfulSubmission('success')).toBe(false);
  });
});

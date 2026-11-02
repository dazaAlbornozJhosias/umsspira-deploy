import {
  MAIL_ERROR_MAX_LENGTH,
  describeMailError,
  mailRetryDelaySeconds,
} from './mail-retry.policy';

describe('Política de reintentos de correo', () => {
  it('espera más después de cada intento fallido', () => {
    expect(mailRetryDelaySeconds(1)).toBe(60);
    expect(mailRetryDelaySeconds(2)).toBe(300);
    expect(mailRetryDelaySeconds(3)).toBe(900);
  });

  it('no se sale de la tabla con valores extremos', () => {
    expect(mailRetryDelaySeconds(0)).toBe(60);
    expect(mailRetryDelaySeconds(99)).toBe(900);
  });

  it('resume el error y no supera el límite guardado', () => {
    expect(describeMailError(new Error('SMTP caído'))).toBe('SMTP caído');
    expect(describeMailError('algo raro')).toBe('Error desconocido');
    expect(describeMailError(new Error('x'.repeat(2000)))).toHaveLength(MAIL_ERROR_MAX_LENGTH);
  });
});
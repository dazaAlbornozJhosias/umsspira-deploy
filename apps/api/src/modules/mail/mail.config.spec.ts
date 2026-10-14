/// <reference types="jest" />
import { readMailConfig } from './mail.config';

describe('readMailConfig', () => {

  const validEnv = {
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_SECURE: 'false',
    MAIL_FROM_NAME: 'Comunidad de Egresados UMSS',
    MAIL_FROM_ADDRESS: 'no-reply@portal-egresados.local',
  };

  it('lee y mapea la configuracion correctamente', () => {
    const config = readMailConfig(validEnv);
    expect(config).toEqual({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
      fromName: 'Comunidad de Egresados UMSS',
      fromAddress: 'no-reply@portal-egresados.local',
    });
  });

  it('lanza un error si falta alguna variable obligatoria', () => {
    const envSinHost = { ...validEnv };
    delete envSinHost.SMTP_HOST;
    expect(() => readMailConfig(envSinHost)).toThrow(
      'Faltan variables de entorno para el correo: SMTP_HOST',
    );
  });

  it('rechaza un puerto que no sea un numero entero positivo', () => {
    expect(() =>
      readMailConfig({ ...validEnv, SMTP_PORT: '-5' }),
    ).toThrow('SMTP_PORT debe ser un numero entero positivo');

    expect(() =>
      readMailConfig({ ...validEnv, SMTP_PORT: 'invalido' }),
    ).toThrow('SMTP_PORT debe ser un numero entero positivo');
  });

  it('exige que SMTP_USER y SMTP_PASSWORD se definan juntos', () => {
    expect(() =>
      readMailConfig({ ...validEnv, SMTP_USER: 'usuario' }),
    ).toThrow('SMTP_USER y SMTP_PASSWORD deben definirse juntos');

    expect(() =>
      readMailConfig({ ...validEnv, SMTP_PASSWORD: 'password' }),
    ).toThrow('SMTP_USER y SMTP_PASSWORD deben definirse juntos');
  });

  it('incluye credenciales si ambas estan presentes', () => {
    const config = readMailConfig({
      ...validEnv,
      SMTP_USER: 'admin',
      SMTP_PASSWORD: 'secretpassword',
    });
    expect(config.auth).toEqual({
      user: 'admin',
      pass: 'secretpassword',
    });
  });

  it('lee la api key de Brevo cuando existe (envio por HTTPS)', () => {
    const config = readMailConfig({ ...validEnv, BREVO_API_KEY: 'api-key-123' });
    expect(config.brevoApiKey).toBe('api-key-123');
  });

  it('deja brevoApiKey indefinida si no esta configurada', () => {
    const config = readMailConfig(validEnv);
    expect(config.brevoApiKey).toBeUndefined();
  });
});
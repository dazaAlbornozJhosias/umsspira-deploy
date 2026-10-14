/// <reference types="jest" />
import { ServiceUnavailableException } from '@nestjs/common';
import { MailService } from './mail.service';
import type { MailConfig } from '../mail.config';

describe('MailService', () => {

  let mailService: MailService;
  let mockTransporter: { sendMail: jest.Mock };
  const mockConfig: MailConfig = {
    host: 'localhost',
    port: 1025,
    secure: false,
    fromName: 'Comunidad de Egresados UMSS',
    fromAddress: 'no-reply@portal-egresados.local',
  };

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };
    mailService = new MailService(mockTransporter as unknown as ConstructorParameters<typeof MailService>[0], mockConfig);
  });

  it('renderiza plantillas y envia el codigo de verificacion por SMTP', async () => {
    await mailService.sendOtpVerification({
      to: 'egresado@umss.edu.bo',
      code: '741852',
      expiresInMinutes: 5,
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const sentMessage = mockTransporter.sendMail.mock.calls[0][0];

    expect(sentMessage.to).toBe('egresado@umss.edu.bo');
    expect(sentMessage.subject).toBe('Tu código de verificación');
    expect(sentMessage.from).toEqual({
      name: 'Comunidad de Egresados UMSS',
      address: 'no-reply@portal-egresados.local',
    });
    // Verifica que el HTML contiene el codigo y el tiempo de expiracion
    expect(sentMessage.html).toContain('741852');
    expect(sentMessage.html).toContain('5 minutos');
    // Verifica la version en texto plano
    expect(sentMessage.text).toContain('741852');
    expect(sentMessage.text).toContain('5 minutos');
  });

  it('escapa caracteres especiales en HTML para prevenir inyeccion', async () => {
    await mailService.sendOtpVerification({
      to: 'egresado@umss.edu.bo',
      code: '<script>alert("hack")</script>',
      expiresInMinutes: 5,
    });

    const sentMessage = mockTransporter.sendMail.mock.calls[0][0];
    expect(sentMessage.html).not.toContain('<script>');
    expect(sentMessage.html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
  });

    describe('correos del dictamen', () => {
    it('envía la aprobación con el código y la vigencia de 24 horas', async () => {
      await mailService.sendReviewApproved({
        to: 'titulado@umss.edu.bo',
        fullName: 'Ana Pérez',
        code: '048213',
        expiresInHours: 24,
      });

      const sent = mockTransporter.sendMail.mock.calls[0][0];
      expect(sent.to).toBe('titulado@umss.edu.bo');
      expect(sent.subject).toBe('Tu solicitud fue aprobada');
      expect(sent.html).toContain('048213');
      expect(sent.html).toContain('24 horas');
      expect(sent.html).toContain('Hola, Ana Pérez:');
      expect(sent.text).toContain('048213');
      expect(sent.text).toContain('24 horas');
    });

    it('usa un saludo genérico si no se conoce el nombre', async () => {
      await mailService.sendReviewApproved({
        to: 'titulado@umss.edu.bo',
        code: '123456',
        expiresInHours: 24,
      });

      const sent = mockTransporter.sendMail.mock.calls[0][0];
      expect(sent.text).toContain('Hola:');
      expect(sent.text).not.toContain('Hola,');
    });

    it('envía las observaciones y escapa el HTML de la nota', async () => {
      await mailService.sendReviewObserved({
        to: 'titulado@umss.edu.bo',
        observation: '<b>Falta</b> el título & el sello',
      });

      const sent = mockTransporter.sendMail.mock.calls[0][0];
      expect(sent.subject).toBe('Tu solicitud tiene observaciones');
      expect(sent.html).not.toContain('<b>Falta</b>');
      expect(sent.html).toContain('&lt;b&gt;Falta&lt;/b&gt; el título &amp; el sello');
      expect(sent.text).toContain('<b>Falta</b> el título & el sello');
    });

    it('envía el rechazo con su justificación', async () => {
      await mailService.sendReviewRejected({
        to: 'titulado@umss.edu.bo',
        justification: 'El documento no corresponde a la carrera indicada.',
      });

      const sent = mockTransporter.sendMail.mock.calls[0][0];
      expect(sent.subject).toBe('Tu solicitud no fue aprobada');
      expect(sent.html).toContain('El documento no corresponde a la carrera indicada.');
      expect(sent.text).toContain('El documento no corresponde a la carrera indicada.');
    });

    it('lanza ServiceUnavailableException si el envío falla', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Connection refused'));

      await expect(
        mailService.sendReviewRejected({
          to: 'titulado@umss.edu.bo',
          justification: 'Motivo',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
  
  it('lanza ServiceUnavailableException si el envio SMTP falla', async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Connection refused'));

    await expect(
      mailService.sendOtpVerification({
        to: 'egresado@umss.edu.bo',
        code: '123456',
        expiresInMinutes: 5,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  describe('cuando esta configurada la API de Brevo (Render bloquea SMTP)', () => {
    let brevoFetch: jest.Mock;

    beforeEach(() => {
      brevoFetch = jest.fn().mockResolvedValue({ ok: true, status: 201, text: async () => '' });
      global.fetch = brevoFetch as unknown as typeof fetch;
      mailService = new MailService(
        mockTransporter as unknown as ConstructorParameters<typeof MailService>[0],
        { ...mockConfig, brevoApiKey: 'api-key-de-brevo' },
      );
    });

    afterEach(() => {
      delete (global as { fetch?: unknown }).fetch;
    });

    it('envia el codigo por HTTPS en lugar de SMTP', async () => {
      await mailService.sendOtpVerification({
        to: 'egresado@umss.edu.bo',
        code: '741852',
        expiresInMinutes: 5,
      });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(brevoFetch).toHaveBeenCalledTimes(1);

      const [url, init] = brevoFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
      expect((init.headers as Record<string, string>)['api-key']).toBe('api-key-de-brevo');

      const body = JSON.parse(String(init.body));
      expect(body.to).toEqual([{ email: 'egresado@umss.edu.bo' }]);
      expect(body.subject).toBe('Tu código de verificación');
      expect(body.htmlContent).toContain('741852');
    });

    it('lanza ServiceUnavailableException si Brevo responde con error', async () => {
      brevoFetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'Invalid API key' });

      await expect(
        mailService.sendOtpVerification({
          to: 'egresado@umss.edu.bo',
          code: '123456',
          expiresInMinutes: 5,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});

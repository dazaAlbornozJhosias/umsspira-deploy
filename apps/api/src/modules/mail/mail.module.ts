import { Logger, Module } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import {
  MAIL_CONFIG,
  MAIL_TRANSPORTER,
  readMailConfig,
} from './mail.config';
import type { MailConfig } from './mail.config';
import { MailService } from './services/mail.service';

@Module({
  providers: [
    {
      // Proveedor de la configuracion validada
      provide: MAIL_CONFIG,
      useFactory: () => readMailConfig(),
    },
    {
      // Conexion SMTP singleton compartida
      provide: MAIL_TRANSPORTER,
      inject: [MAIL_CONFIG],
      useFactory: (config: MailConfig) => {
        const transporter = createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: config.auth,
          // Sin estos límites, un servidor de correo inalcanzable mantiene la
          // petición colgada ~2 minutos (timeout por defecto de nodemailer).
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        });

        // Diagnóstico al arrancar: sin esto, un SMTP mal configurado solo se
        // descubre cuando alguien intenta verificar su correo.
        new Logger('Mail').log(
          `Correo configurado: ${config.brevoApiKey ? 'API HTTPS de Brevo' : `SMTP ${config.host}:${config.port}`} ` +
            `(secure=${String(config.secure)}, remitente=${config.fromAddress})`,
        );
        if (config.brevoApiKey) {
          fetch('https://api.brevo.com/v3/account', {
            headers: { 'api-key': config.brevoApiKey, accept: 'application/json' },
          })
            .then((response) =>
              response.ok
                ? new Logger('Mail').log('Conexión con Brevo verificada: la API key es válida')
                : new Logger('Mail').error(
                    `La verificación con Brevo falló (HTTP ${String(response.status)}): revisa BREVO_API_KEY`,
                  ),
            )
            .catch((error: Error) =>
              new Logger('Mail').error(`La verificación con Brevo falló: ${error.message}`),
            );
        } else {
          transporter
            .verify()
            .then(() => new Logger('Mail').log('Conexión SMTP verificada: el servidor acepta la autenticación'))
            .catch((error: Error & { code?: string }) =>
              new Logger('Mail').error(
                `La verificación SMTP falló (${error.code ?? 'sin código'}): ${error.message}`,
              ),
            );
        }

        return transporter;
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
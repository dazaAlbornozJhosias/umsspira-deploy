import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { CorrectionTokenService } from '../services/correction-token.service';
import {
  REGISTRATION_SECURITY,
  type RegistrationSecurity,
} from '../ports/registration-security.port';
import type { RequestCorrectionLinkInput } from '../../http/schemas/registrations.schemas';
import {
  CORRECTION_REQUEST_COOLDOWN_SECONDS,
  CORRECTION_REQUEST_DAILY_LIMIT,
} from '../../domain/policies/correction.policy';

@Injectable()
export class RequestCorrectionLinkUseCase {
  private readonly logger = new Logger(RequestCorrectionLinkUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: CorrectionTokenService,
    @Inject(REGISTRATION_SECURITY) private readonly security: RegistrationSecurity,
  ) {}

  async execute(input: RequestCorrectionLinkInput): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado',
    };

    // Procesamiento en segundo plano / seguro para garantizar respuesta indistinguible
    try {
      const expedido = input.expedidoEn === 'EX' ? 'Extranjero' : input.expedidoEn;
      const extension = input.complemento?.trim() ? input.complemento.trim() : null;

      const details = await this.prisma.detalleSolicitud.findMany({
        where: {
          ci: input.ci.trim(),
          ...(extension ? { extension_ci: extension } : {}),
          expedido_en: expedido as import('../../../../generated/prisma/client').DepartamentoExpedicion,
        },
        include: {
          solicitud_registros: {
            where: {
              estado: { in: ['OBSERVED', 'OBSERVADA'] },
            },
            orderBy: { fecha_actualizacion: 'desc' },
            take: 1,
          },
        },
      });

      const matchedDetail = details.find((d) => d.solicitud_registros.length > 0);
      const solicitud = matchedDetail?.solicitud_registros[0];

      if (!solicitud || !matchedDetail?.email) {
        this.logger.log('Peticion de enlace de subsanacion: no se encontro solicitud observada');
        return genericResponse;
      }

      const now = Date.now();
      const cooldownThreshold = new Date(now - CORRECTION_REQUEST_COOLDOWN_SECONDS * 1000);
      const dailyThreshold = new Date(now - 86400 * 1000);

      const recentTokens = await this.prisma.tokenSubsanacion.findMany({
        where: {
          id_solicitud: solicitud.id,
          created_at: { gte: dailyThreshold },
        },
        orderBy: { created_at: 'desc' },
      });

      if (recentTokens.length >= CORRECTION_REQUEST_DAILY_LIMIT) {
        this.logger.warn('Peticion de enlace ignorada: tope diario de reenvios alcanzado');
        return genericResponse;
      }

      if (recentTokens.length > 0 && recentTokens[0].created_at >= cooldownThreshold) {
        this.logger.warn('Peticion de enlace ignorada: cooldown activo');
        return genericResponse;
      }

      const link = await this.tokenService.issueLink(solicitud.id);
      const email = matchedDetail.email;

      const subject = 'Enlace para corregir tu solicitud en UMSSPIRA';
      const text = [
        matchedDetail.nombre ? `Hola ${matchedDetail.nombre},` : 'Hola,',
        '',
        'Tu solicitud de registro tiene observaciones. Ingresa al siguiente enlace para corregirla:',
        link,
        '',
        'Este enlace es confidencial, de uso único por solicitud y vence en el plazo establecido.',
        '',
        'Equipo UMSSPIRA',
      ].join('\n');

      const sealedMail = this.security.seal({
        to: email,
        subject,
        text,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.correoPendiente.create({
          data: {
            contenido: sealedMail,
            expira_en: new Date(now + 86400 * 1000),
          },
        });

        await tx.correoTramite.create({
          data: {
            id_solicitud: solicitud.id,
            tipo: 'subsanacion',
            email_destino: email,
            asunto: subject,
            estado: 'pendiente',
          },
        });
      });

      this.logger.log('Enlace de subsanacion generado y encolado para envio');
    } catch {
      this.logger.error('Error interno al procesar solicitud de enlace de subsanacion');
    }

    return genericResponse;
  }
}

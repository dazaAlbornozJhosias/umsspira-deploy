import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ApplicationStatus,
  ReviewResponse,
} from '@umsspira/shared-types';
import { ActivationCodeService } from '@/modules/activation/services/activation-code.service';
import { MailService } from '@/modules/mail/services/mail.service';
import { CreateReviewDto } from '../contracts/dto/create-review.dto';
import { ReviewsRepository } from '../repositories/reviews.repository';

// Qué estado le toca a la solicitud según la decisión
const STATUS_BY_DECISION: Record<
  CreateReviewDto['decision'],
  ApplicationStatus
> = {
  APPROVED: 'APPROVED',
  OBSERVED: 'OBSERVED',
  REJECTED: 'REJECTED',
};

// Vigencia del código de activación (la misma que usa Redis)
const ACTIVATION_CODE_HOURS = 24;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly activationCode: ActivationCodeService,
    private readonly mailService: MailService,
  ) {}

  async createReview(
    applicationId: string,
    dto: CreateReviewDto,
    reviewerId: string,
  ): Promise<ReviewResponse> {
    const currentStatus =
      await this.reviewsRepository.getApplicationStatus(applicationId);

    if (!currentStatus) {
      throw new NotFoundException('La solicitud no existe.');
    }

    // Solo se dictamina lo "Pendiente de validación" (CA-04.4)
    if (currentStatus !== 'PENDING') {
      throw new ConflictException(
        'La solicitud ya fue dictaminada y no admite otro dictamen.',
      );
    }

    const isApproval = dto.decision === 'APPROVED';

    const review = await this.reviewsRepository.saveReview({
      applicationId,
      decision: dto.decision,
      status: STATUS_BY_DECISION[dto.decision],
      category: isApproval ? null : (dto.category ?? null),
      note: isApproval ? null : (dto.note ?? null),
      reviewedBy: reviewerId, // auditoría: quién dictaminó
    });

    this.logger.log(
      `Dictamen ${review.decision} registrado para ${applicationId} por ${reviewerId}`,
    );

    // El dictamen ya está guardado. La notificación no bloquea la respuesta
    // (un SMTP lento no debe congelar el panel) y sus errores no lo deshacen.
    void this.notifyApplicant(applicationId, dto);

    return review;
  }

  /**
   * Genera el código de activación (solo al aprobar) y avisa al titulado por correo.
   * Nunca lanza: cualquier fallo se registra. En los logs va el id de la solicitud,
   * nunca el código ni el contenido del correo.
   */
  private async notifyApplicant(
    applicationId: string,
    dto: CreateReviewDto,
  ): Promise<void> {
    try {
      const applicant =
        await this.reviewsRepository.getApplicantContact(applicationId);

      if (!applicant) {
        this.logger.warn(
          `Sin datos de contacto para notificar la solicitud ${applicationId}`,
        );
        return;
      }

      const { email: to, fullName } = applicant;

      if (dto.decision === 'APPROVED') {
        const code = await this.activationCode.issue(applicationId);
        await this.mailService.sendReviewApproved({
          to,
          fullName,
          code,
          expiresInHours: ACTIVATION_CODE_HOURS,
        });
        return;
      }

      const message = [dto.category, dto.note].filter(Boolean).join('\n\n');

      if (dto.decision === 'OBSERVED') {
        await this.mailService.sendReviewObserved({
          to,
          fullName,
          observation: message,
        });
      } else {
        await this.mailService.sendReviewRejected({
          to,
          fullName,
          justification: message,
        });
      }
      // TODO: copia al decanato si dto.notifyDean (falta definir el correo del decanato)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(
        `El dictamen de la solicitud ${applicationId} se guardó, pero falló la notificación: ${reason}. Puede requerir reenvío.`,
      );
    }
  }
}
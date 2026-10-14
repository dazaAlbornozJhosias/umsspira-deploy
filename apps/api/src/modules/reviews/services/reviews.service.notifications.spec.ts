import { Logger } from '@nestjs/common';
import type { ActivationCodeService } from '@/modules/activation/services/activation-code.service';
import type { MailService } from '@/modules/mail/services/mail.service';
import type { CreateReviewDto } from '../contracts/dto/create-review.dto';
import type { ReviewsRepository } from '../repositories/reviews.repository';
import { ReviewsService } from './reviews.service';

// La notificación corre sin bloquear la respuesta: se espera a que termine
const flush = () => new Promise((resolve) => setImmediate(resolve));

const approved = { decision: 'APPROVED' } as CreateReviewDto;
const observed = {
  decision: 'OBSERVED',
  category: 'Documento ilegible',
  note: 'La imagen no se lee con claridad.',
} as CreateReviewDto;
const rejected = {
  decision: 'REJECTED',
  category: 'Trámite duplicado',
  note: 'Ya existe una solicitud aprobada con estos datos.',
} as CreateReviewDto;

describe('ReviewsService: notificaciones del dictamen', () => {
  const applicant = { email: 'titulado@umss.edu.bo', fullName: 'Ana Pérez' };

  let repository: {
    getApplicationStatus: jest.Mock;
    saveReview: jest.Mock;
    getApplicantContact: jest.Mock;
  };
  let activationCode: { issue: jest.Mock };
  let mailService: {
    sendReviewApproved: jest.Mock;
    sendReviewObserved: jest.Mock;
    sendReviewRejected: jest.Mock;
  };
  let service: ReviewsService;

  beforeEach(() => {
    repository = {
      getApplicationStatus: jest.fn().mockResolvedValue('PENDING'),
      saveReview: jest.fn().mockImplementation(async (input) => ({
        id: 'review-1',
        reviewedAt: '2026-10-08T00:00:00.000Z',
        ...input,
      })),
      getApplicantContact: jest.fn().mockResolvedValue(applicant),
    };
    activationCode = { issue: jest.fn().mockResolvedValue('048213') };
    mailService = {
      sendReviewApproved: jest.fn().mockResolvedValue(undefined),
      sendReviewObserved: jest.fn().mockResolvedValue(undefined),
      sendReviewRejected: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReviewsService(
      repository as unknown as ReviewsRepository,
      activationCode as unknown as ActivationCodeService,
      mailService as unknown as MailService,
    );
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('al aprobar genera el código y envía el correo con su vigencia', async () => {
    await service.createReview('app-1', approved, 'admin-1');
    await flush();

    expect(activationCode.issue).toHaveBeenCalledWith('app-1');
    expect(mailService.sendReviewApproved).toHaveBeenCalledWith({
      to: 'titulado@umss.edu.bo',
      fullName: 'Ana Pérez',
      code: '048213',
      expiresInHours: 24,
    });
  });

  it('al observar envía la categoría y la nota, sin generar código', async () => {
    await service.createReview('app-1', observed, 'admin-1');
    await flush();

    expect(mailService.sendReviewObserved).toHaveBeenCalledWith({
      to: 'titulado@umss.edu.bo',
      fullName: 'Ana Pérez',
      observation: 'Documento ilegible\n\nLa imagen no se lee con claridad.',
    });
    expect(activationCode.issue).not.toHaveBeenCalled();
  });

  it('al rechazar envía la causal y la justificación, sin generar código', async () => {
    await service.createReview('app-1', rejected, 'admin-1');
    await flush();

    expect(mailService.sendReviewRejected).toHaveBeenCalledWith({
      to: 'titulado@umss.edu.bo',
      fullName: 'Ana Pérez',
      justification:
        'Trámite duplicado\n\nYa existe una solicitud aprobada con estos datos.',
    });
    expect(activationCode.issue).not.toHaveBeenCalled();
  });

  it('el dictamen no falla si el correo no se puede enviar', async () => {
    mailService.sendReviewRejected.mockRejectedValue(new Error('SMTP caído'));

    const review = await service.createReview('app-1', rejected, 'admin-1');
    await flush();

    expect(review.decision).toBe('REJECTED');
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('no envía correo si falla la generación del código', async () => {
    activationCode.issue.mockRejectedValue(new Error('Redis caído'));

    const review = await service.createReview('app-1', approved, 'admin-1');
    await flush();

    expect(review.decision).toBe('APPROVED');
    expect(mailService.sendReviewApproved).not.toHaveBeenCalled();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('registra una advertencia si no hay datos del titulado', async () => {
    repository.getApplicantContact.mockResolvedValue(null);

    await service.createReview('app-1', approved, 'admin-1');
    await flush();

    expect(activationCode.issue).not.toHaveBeenCalled();
    expect(mailService.sendReviewApproved).not.toHaveBeenCalled();
    expect(Logger.prototype.warn).toHaveBeenCalled();
  });

  it('no notifica si la solicitud ya fue dictaminada', async () => {
    repository.getApplicationStatus.mockResolvedValue('APPROVED');

    await expect(service.createReview('app-1', approved, 'admin-1')).rejects.toThrow();
    await flush();

    expect(repository.saveReview).not.toHaveBeenCalled();
    expect(mailService.sendReviewApproved).not.toHaveBeenCalled();
  });
});

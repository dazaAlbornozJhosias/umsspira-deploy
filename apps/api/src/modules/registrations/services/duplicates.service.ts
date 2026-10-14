import { ConflictException, Injectable } from '@nestjs/common';
import { RegistrationsRepository } from '../repositories/registrations.repository';

export interface DuplicateCheckInput {
  ci: string;
  complementoCi: string;
  expedidoEn: string;
  correo: string;
  codigoSis: string;
}

export const DUPLICATE_MESSAGES = {
  ci: 'El documento de identidad ingresado ya cuenta con una solicitud registrada',
  correo: 'Este correo electrónico ya está registrado en otra solicitud',
  codigoSis: 'Este Código SIS ya está registrado en otra solicitud',
} as const;

export type DuplicateField = keyof typeof DUPLICATE_MESSAGES;

/**
 * Verifica que no exista una solicitud activa (no rechazada) con el mismo C.I.,
 * correo o Código SIS (CA-01.4). Las solicitudes rechazadas no bloquean un nuevo
 * registro (CA-01.5); ese filtro lo aplica el repositorio.
 * Se detiene en el primer dato repetido para resaltar solo ese campo.
 */
@Injectable()
export class DuplicatesService {
  constructor(private readonly registrationsRepository: RegistrationsRepository) {}

  async assertNoActiveApplication(input: DuplicateCheckInput): Promise<void> {
    const identityMatch = await this.registrationsRepository.findActiveApplicationByIdentity(
      input.ci,
      input.complementoCi,
      input.expedidoEn,
    );
    if (identityMatch) {
      this.throwConflict('ci');
    }

    const emailMatch = await this.registrationsRepository.findActiveApplicationByEmail(input.correo);
    if (emailMatch) {
      this.throwConflict('correo');
    }

    const sisMatch = await this.registrationsRepository.findActiveApplicationBySisCode(input.codigoSis);
    if (sisMatch) {
      this.throwConflict('codigoSis');
    }
  }

  private throwConflict(field: DuplicateField): never {
    const message = DUPLICATE_MESSAGES[field];
    throw new ConflictException({ statusCode: 409, message, field, errors: [{ field, message }] });
  }
}

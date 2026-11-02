import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../ports/events-repository.port';
// IMPORTANTE: Ajusta esta ruta a la ubicación real del servicio que hizo tu equipo
import { GenerateEventPassService } from '../generate-event-pass.service';

export class RegisterEventUseCase {
  constructor(
    private readonly repository: EventsRepository,
    private readonly generatePassService: GenerateEventPassService // 1. Inyectamos el servicio
  ) {}

  async execute(actor: ActorContext, eventId: string) {
    // 2. Guardamos la inscripción en la base de datos
    const inscripcion = await this.repository.register(actor.id, eventId);

    // 3. Generamos el pase automáticamente 
    // (Verifica si tu equipo le puso .execute(), .generate(), o similar al método)
    await this.generatePassService.execute(inscripcion.id, actor.id);

    // 4. Retornamos la inscripción final
    return inscripcion;
  }
}
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
// Cliente compartido del equipo (única línea a ajustar si exporta otro nombre).
import { supabase } from '../../shared/lib/supabase';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import {
  DisponibilidadMentor,
  MentorAvailability,
  MentorAvailabilityStatus,
  isAvailabilityStatus,
  latestRowByMentor,
} from './mentorship-availability.model';

/** HU-6.4: estado de disponibilidad del mentor en `disponibilidad_mentor`. */
@Injectable()
export class MentorshipAvailabilityService {
  private readonly logger = new Logger(MentorshipAvailabilityService.name);

  /** GET /mentorship/availability */
  async getAvailability(mentorId: string): Promise<MentorAvailability> {
    // Regla 1: el mentor debe existir (404) y estar activo (403).
    await this.requireActiveMentor(mentorId);

    // Regla 6 (CA-F 14): sin fila responde availabilityStatus: null y no crea nada.
    const row = await this.currentRow(mentorId);
    return {
      availabilityStatus: toStatus(row?.estado),
      fecha_actualizacion: row?.fecha_actualizacion ?? null,
    };
  }

  /** PATCH /mentorship/availability */
  async setAvailability(
    mentorId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<MentorAvailability> {
    // Regla 1: el mentor debe existir (404) y estar activo (403).
    await this.requireActiveMentor(mentorId);

    // Regla 3 (CA-NF 03): cualquier otro valor o campo ausente responde 400.
    // (validación defensiva: main.ts no registra ValidationPipe global).
    const status = this.parseStatus(dto?.availabilityStatus);
    const today = this.today();

    // Regla 8: se busca la fila existente; si existe se actualiza, si no se crea.
    const row = await this.currentRow(mentorId);

    if (row) {
      // Regla 2: puede cambiar de estado las veces que quiera.
      if (toStatus(row.estado) === status) {
        // Mismo estado que el actual: se responde 200 sin error y sin escribir.
        return { availabilityStatus: status, fecha_actualizacion: row.fecha_actualizacion };
      }
      // CA-NF 04: solo se tocan estado y fecha_actualizacion de disponibilidad_mentor.
      const { data, error } = await supabase
        .from('disponibilidad_mentor')
        .update({ estado: status, fecha_actualizacion: today })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) this.fail(error);
      return this.toResponse(data as DisponibilidadMentor | null, status);
    }

    // Sin fila previa: hora_inicio y hora_fin no se tocan (quedan en NULL).
    const { data, error } = await supabase
      .from('disponibilidad_mentor')
      .insert({
        id_mentor: mentorId,
        estado: status,
        fecha_creacion: today,
        fecha_actualizacion: today,
      })
      .select('*')
      .single();
    if (error) this.fail(error);
    return this.toResponse(data as DisponibilidadMentor | null, status);
  }

  /**
   * Regla 7: el módulo de solicitudes lo usa para saber si el mentor recibe
   * solicitudes. Devuelve true solo si el estado es AVAILABLE.
   */
  async canReceiveRequests(mentorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('mentor')
      .select('id, esta_activo')
      .eq('id', mentorId)
      .maybeSingle();
    if (error) this.fail(error);
    // Decisión: un mentor inexistente o inactivo no recibe solicitudes.
    if (!data || data.esta_activo !== true) return false;

    const row = await this.currentRow(mentorId);
    return toStatus(row?.estado) === MentorAvailabilityStatus.AVAILABLE;
  }

  // ---------- helpers privados ----------

  /** Regla 1: el mentor debe existir (404) y estar activo (403 "Acceso denegado"). */
  private async requireActiveMentor(mentorId: string): Promise<void> {
    const { data, error } = await supabase
      .from('mentor')
      .select('id, esta_activo')
      .eq('id', mentorId)
      .maybeSingle();
    if (error) this.fail(error);
    if (!data) {
      throw new NotFoundException('El usuario no tiene perfil de mentor');
    }
    if (data.esta_activo !== true) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  /** Regla 8: fila vigente del mentor; con duplicados previos, la más reciente. */
  private async currentRow(mentorId: string): Promise<DisponibilidadMentor | null> {
    const { data, error } = await supabase
      .from('disponibilidad_mentor')
      .select('*')
      .eq('id_mentor', mentorId);
    if (error) this.fail(error);

    const rows = (data ?? []) as DisponibilidadMentor[];
    if (rows.length > 1) {
      // Regla 8: id_mentor no tiene UNIQUE; se avisa y se usa la fila más reciente.
      this.logger.warn(
        `Mentor ${mentorId} tiene ${rows.length} filas en disponibilidad_mentor; se usa la más reciente`,
      );
    }
    return latestRowByMentor(rows).get(mentorId) ?? null;
  }

  /** Regla 3 (CA-NF 03): solo AVAILABLE, PAUSED o UNAVAILABLE. */
  private parseStatus(value: unknown): MentorAvailabilityStatus {
    if (isAvailabilityStatus(value)) return value;
    throw new BadRequestException('availabilityStatus debe ser AVAILABLE, PAUSED o UNAVAILABLE');
  }

  private toResponse(
    row: DisponibilidadMentor | null,
    fallback: MentorAvailabilityStatus,
  ): MentorAvailability {
    return {
      availabilityStatus: toStatus(row?.estado) ?? fallback,
      fecha_actualizacion: row?.fecha_actualizacion ?? this.today(),
    };
  }

  private fail(error: PostgrestError): never {
    throw new InternalServerErrorException(error.message);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Estado guardado como enum; NULL si la fila no existe o trae un valor inesperado. */
function toStatus(value: string | null | undefined): MentorAvailabilityStatus | null {
  return isAvailabilityStatus(value) ? value : null;
}

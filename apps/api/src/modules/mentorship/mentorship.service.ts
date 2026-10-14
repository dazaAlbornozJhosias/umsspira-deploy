import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
// Cliente compartido del equipo (única línea a ajustar si exporta otro nombre).
import { supabase } from '../../shared/lib/supabase';
import {
  DisponibilidadMentor,
  MentorAvailabilityStatus,
  latestRowByMentor,
} from './mentorship-availability.model';
import { UpdateMentorAreasDto } from './dto/update-mentor-areas.dto';
import { UpdateMentorProfileInformationDto } from './dto/update-mentor-profile-information.dto';
import { UpdateParticipationDto } from './dto/update-participation.dto';
import { Mentor } from './mentor.model';
import { MentorshipInterestsService } from './mentorship-interests.service';

const PG_UNIQUE_VIOLATION = '23505';
const MIN_MENTOR_AREAS = 1;
const MAX_MENTOR_AREAS = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Area {
  id: string;
  nombre: string;
  esta_activo: boolean;
  padre_id: string | null;
}

interface MentorAreaLink {
  id: string;
  id_area: string;
}

/** Contrato del frontend (mentor-areas-api.ts). */
export interface MentorAreaItem {
  id: string;
  nombre: string;
  descripcion: string | null;
}

/** Interés dependiente de un área seleccionada (HU-03). */
export interface MentorInterestLink {
  id_area: string;
  nombre: string;
}

export interface MentorAreasState {
  areas: MentorAreaItem[];
  selectedIds: string[];
  intereses: MentorInterestLink[];
}

export interface MentorProfileInformationState {
  exists: boolean;
  profile: {
    descripcion?: string | null;
    experiencia: string | null;
    informacion_relevante?: string | null;
    foto_perfil?: string | null;
    anios_exp: number | null;
    fecha_actualizacion: string | null;
  } | null;
}

export interface ModuleStatus {
  module: string;
  status: 'ok';
  activeMentors: number;
  timestamp: string;
}

@Injectable()
export class MentorshipService {
  // HU-03 (regla 7): al quitar un área se borran sus intereses hijos con este servicio.
  constructor(private readonly interestsService: MentorshipInterestsService) {}

  /** GET /mentorship/status */
  async getStatus(): Promise<ModuleStatus> {
    const { count, error } = await supabase
      .from('mentor')
      .select('id', { count: 'exact', head: true })
      .eq('esta_activo', true);
    if (error) this.fail(error);

    return {
      module: 'mentorship',
      status: 'ok',
      activeMentors: count ?? 0,
      timestamp: new Date().toISOString(),
    };
  }

  /** GET /mentorship/profiles */
  async getActiveProfiles(): Promise<Mentor[]> {
    const { data, error } = await supabase
      .from('mentor')
      .select('*')
      .eq('esta_activo', true)
      .order('fecha_creacion', { ascending: false });
    if (error) this.fail(error);
    const mentors = (data ?? []) as Mentor[];

    // Regla 7 (HU-6.4): los mentores con estado UNAVAILABLE no aparecen en el
    // directorio público; los que no tienen fila en disponibilidad_mentor siguen.
    const mentorIds = mentors.map(({ id }) => id);
    const { data: rows, error: rowsError } = mentorIds.length
      ? await supabase.from('disponibilidad_mentor').select('*').in('id_mentor', mentorIds)
      : { data: [], error: null };
    if (rowsError) this.fail(rowsError);
    const current = latestRowByMentor((rows ?? []) as DisponibilidadMentor[]);
    return mentors.filter(
      ({ id }) => current.get(id)?.estado !== MentorAvailabilityStatus.UNAVAILABLE,
    );
  }

  /** GET /mentorship/my-profile */
  async getMyProfile(userId: string): Promise<Mentor> {
    const profile = await this.findById(userId);
    if (!profile) {
      throw new NotFoundException('El usuario no tiene perfil de mentor');
    }
    return profile;
  }

  /** GET /mentorship/my-profile/information (read-only; does not create a profile). */
  async getMyProfileInformation(userId: string): Promise<MentorProfileInformationState> {
    const profile = await this.findById(userId);
    if (!profile) {
      return { exists: false, profile: null };
    }

    if (!profile.experiencia) {
      return { exists: false, profile: null };
    }

    const parsed = this.parseExperiencia(profile.experiencia);
    return {
      exists: Boolean(parsed.experiencia || parsed.descripcion),
      profile: {
        descripcion: parsed.descripcion,
        experiencia: parsed.experiencia,
        informacion_relevante: parsed.informacion_relevante,
        foto_perfil: parsed.foto_perfil,
        anios_exp: profile.anios_exp,
        fecha_actualizacion: profile.fecha_actualizacion,
      },
    };
  }

  /** PATCH /mentorship/my-profile/information */
  async updateMyProfileInformation(
    userId: string,
    dto: UpdateMentorProfileInformationDto,
  ): Promise<MentorProfileInformationState> {
    if (!(await this.findById(userId))) {
      throw new NotFoundException('El usuario no tiene perfil de mentor');
    }

    const payloadObj = {
      descripcion: dto.descripcion ?? null,
      experiencia: dto.experiencia.trim(),
      informacion_relevante: dto.informacion_relevante ?? null,
      foto_perfil: dto.foto_perfil ?? null,
    };

    const changes: Partial<Mentor> = {
      experiencia: JSON.stringify(payloadObj),
      fecha_actualizacion: this.today(),
    };
    if (dto.anios_exp !== undefined) {
      changes.anios_exp = dto.anios_exp;
    }

    const profile = await this.update(userId, changes);
    return {
      exists: true,
      profile: {
        descripcion: payloadObj.descripcion,
        experiencia: payloadObj.experiencia,
        informacion_relevante: payloadObj.informacion_relevante,
        foto_perfil: payloadObj.foto_perfil,
        anios_exp: profile.anios_exp,
        fecha_actualizacion: profile.fecha_actualizacion,
      },
    };
  }

  /** DELETE /mentorship/my-profile/information */
  async deleteMyProfileInformation(userId: string): Promise<MentorProfileInformationState> {
    const profile = await this.findById(userId);
    if (!profile) {
      throw new NotFoundException('El usuario no tiene perfil de mentor');
    }

    const changes: Partial<Mentor> = {
      experiencia: null,
      fecha_actualizacion: this.today(),
    };

    await this.update(userId, changes);
    return {
      exists: false,
      profile: null,
    };
  }

  private parseExperiencia(raw: string | null): {
    descripcion: string | null;
    experiencia: string | null;
    informacion_relevante: string | null;
    foto_perfil: string | null;
  } {
    if (!raw) {
      return { descripcion: null, experiencia: null, informacion_relevante: null, foto_perfil: null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          descripcion: typeof parsed.descripcion === 'string' ? parsed.descripcion : null,
          experiencia: typeof parsed.experiencia === 'string' ? parsed.experiencia : null,
          informacion_relevante: typeof parsed.informacion_relevante === 'string' ? parsed.informacion_relevante : null,
          foto_perfil: typeof parsed.foto_perfil === 'string' ? parsed.foto_perfil : null,
        };
      }
    } catch {
      // Formato texto plano anterior
    }
    return {
      descripcion: null,
      experiencia: raw,
      informacion_relevante: null,
      foto_perfil: null,
    };
  }

  /**
   * Regla 6.1.1: ¿es egresado aprobado?
   * Supuesto: la tabla `titulado` solo contiene egresados aprobados y su `id`
   * es el UUID del usuario. Consulta de SOLO LECTURA.
   */
  async isApprovedGraduate(userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('titulado')
      .select('id', { count: 'exact', head: true })
      .eq('id', userId);
    if (error) this.fail(error);
    return (count ?? 0) > 0;
  }

  /** POST /mentorship/eligibility */
  async checkEligibility(userId: string): Promise<{ eligible: boolean }> {
    return { eligible: await this.isApprovedGraduate(userId) };
  }

  /** GET /mentorship/my-profile/areas */
  async getMyAreas(userId: string): Promise<MentorAreasState> {
    await this.ensureActiveMentor(userId);

    // HU-03: el catálogo son solo las áreas técnicas (raíz); los intereses son sus hijos.
    const [{ data: catalog, error: catalogError }, { data: links, error: linksError }] =
      await Promise.all([
        supabase
          .from('area')
          .select('id, nombre')
          .eq('esta_activo', true)
          .is('padre_id', null)
          .order('nombre', { ascending: true }),
        supabase.from('mentor_area').select('id, id_area').eq('id_mentor', userId),
      ]);

    if (catalogError) this.fail(catalogError);
    if (linksError) this.fail(linksError);

    // HU-03: mentor_area guarda áreas e intereses; aquí solo cuentan las áreas raíz.
    const linkedIds = [
      ...new Set(((links ?? []) as MentorAreaLink[]).map(({ id_area }) => id_area)),
    ];
    const { data: linkedAreas, error: linkedAreasError } = linkedIds.length
      ? await supabase.from('area').select('id, padre_id').in('id', linkedIds)
      : { data: [], error: null };
    if (linkedAreasError) this.fail(linkedAreasError);

    const selectedIds = [
      ...new Set(
        ((linkedAreas ?? []) as Area[])
          .filter((area) => area.padre_id === null)
          .map(({ id }) => id),
      ),
    ];

    // Intereses dependientes (HU-03): el frontend avisa qué se borraría al quitar un área.
    const intereses = (await this.interestsService.getMyInterests(userId)).map((interest) => ({
      id_area: interest.area.id,
      nombre: interest.nombre,
    }));

    return {
      // La tabla area no tiene columna descripcion: se envía siempre null (contrato del frontend).
      areas: ((catalog ?? []) as Area[]).map(({ id, nombre }) => ({
        id,
        nombre,
        descripcion: null,
      })),
      selectedIds,
      intereses,
    };
  }

  /** PATCH /mentorship/my-profile/areas */
  async updateMyAreas(
    userId: string,
    dto: UpdateMentorAreasDto,
  ): Promise<MentorAreasState> {
    await this.ensureActiveMentor(userId);
    if (!(await this.isApprovedGraduate(userId))) {
      throw new ForbiddenException({
        code: 'MENTOR_NOT_ELIGIBLE',
        message: 'Solo un egresado aprobado puede modificar sus áreas técnicas',
      });
    }

    const requestedIds = dto?.areaIds;
    if (
      !Array.isArray(requestedIds) ||
      requestedIds.length < MIN_MENTOR_AREAS ||
      requestedIds.length > MAX_MENTOR_AREAS
    ) {
      throw new UnprocessableEntityException({
        code: 'CANTIDAD_AREAS_INVALIDA',
        message: `Debes seleccionar entre ${MIN_MENTOR_AREAS} y ${MAX_MENTOR_AREAS} áreas técnicas`,
      });
    }

    if (requestedIds.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))) {
      throw new UnprocessableEntityException({
        code: 'AREA_NO_EXISTE',
        message: 'Las áreas deben seleccionarse usando IDs existentes del catálogo',
      });
    }

    const areaIds = [...new Set(requestedIds)];
    const { data: areas, error: areasError } = await supabase
      .from('area')
      .select('id, nombre, esta_activo, padre_id')
      .in('id', areaIds);
    if (areasError) this.fail(areasError);

    const areasById = new Map(((areas ?? []) as Area[]).map((area) => [area.id, area]));
    const missingAreaId = areaIds.find((areaId) => !areasById.has(areaId));
    if (missingAreaId) {
      throw new UnprocessableEntityException({
        code: 'AREA_NO_EXISTE',
        message: 'Una o más áreas no existen en el catálogo',
      });
    }

    // HU-03: solo se asignan áreas técnicas (raíz); los intereses se eligen en su HU.
    const interestAsAreaId = areaIds.find((areaId) => areasById.get(areaId)?.padre_id !== null);
    if (interestAsAreaId) {
      throw new UnprocessableEntityException({
        code: 'AREA_NO_VALIDA',
        message: 'Solo se pueden asignar áreas técnicas del catálogo, no intereses',
      });
    }

    if (areaIds.some((areaId) => !areasById.get(areaId)?.esta_activo)) {
      throw new UnprocessableEntityException({
        code: 'AREA_INACTIVA',
        message: 'No se pueden asignar áreas inactivas',
      });
    }

    const { data: links, error: linksError } = await supabase
      .from('mentor_area')
      .select('id, id_area')
      .eq('id_mentor', userId);
    if (linksError) this.fail(linksError);

    const existingLinks = (links ?? []) as MentorAreaLink[];

    // HU-03: mentor_area también guarda intereses; aquí solo se gestionan áreas raíz.
    const linkedIds = [...new Set(existingLinks.map(({ id_area }) => id_area))];
    const { data: linkedAreas, error: linkedAreasError } = linkedIds.length
      ? await supabase.from('area').select('id, padre_id').in('id', linkedIds)
      : { data: [], error: null };
    if (linkedAreasError) this.fail(linkedAreasError);
    const linkedRootIds = new Set(
      ((linkedAreas ?? []) as Area[]).filter((area) => area.padre_id === null).map(({ id }) => id),
    );

    const requestedIdSet = new Set(areaIds);
    const retainedAreaIds = new Set<string>();
    const linksToRemove: string[] = [];
    const removedAreaIds = new Set<string>();
    for (const link of existingLinks) {
      if (!linkedRootIds.has(link.id_area)) continue; // intereses: los gestiona la HU-03
      if (requestedIdSet.has(link.id_area) && !retainedAreaIds.has(link.id_area)) {
        retainedAreaIds.add(link.id_area);
      } else {
        linksToRemove.push(link.id);
        removedAreaIds.add(link.id_area);
      }
    }

    const linksToAdd = areaIds.filter((areaId) => !retainedAreaIds.has(areaId));
    const { data: insertedLinks, error: insertError } = linksToAdd.length
      ? await supabase
          .from('mentor_area')
          .insert(
            linksToAdd.map((id_area) => ({
              id_mentor: userId,
              id_area,
              fecha_creacion: this.today(),
            })),
          )
          .select('id')
      : { data: [], error: null };
    if (insertError) this.fail(insertError);

    if (linksToRemove.length) {
      const { error: deleteError } = await supabase
        .from('mentor_area')
        .delete()
        .in('id', linksToRemove);
      if (deleteError) {
        const insertedIds = (insertedLinks ?? []).map(({ id }: { id: string }) => id);
        if (insertedIds.length) {
          const { error: rollbackError } = await supabase
            .from('mentor_area')
            .delete()
            .in('id', insertedIds);
          if (rollbackError) {
            throw new InternalServerErrorException(
              `No se pudieron completar ni revertir los vínculos de áreas: ${rollbackError.message}`,
            );
          }
        }
        this.fail(deleteError);
      }
    }

    // Regla 7 (HU-03): al quitar un área se eliminan también sus intereses hijos.
    for (const areaId of removedAreaIds) {
      await this.interestsService.removeInterestsByArea(userId, areaId);
    }

    return this.getMyAreas(userId);
  }

  /** PATCH /mentorship/my-profile/participation (core HU-6.1) */
  async setParticipation(userId: string, dto: UpdateParticipationDto): Promise<Mentor> {
    const existing = await this.findById(userId);
    const today = this.today();

    if (!dto.esta_activo) {
      // 6.1.4: solo cambia estado y fecha, nunca borra.
      if (!existing) {
        throw new NotFoundException('El usuario no tiene perfil de mentor');
      }
      return this.update(userId, { esta_activo: false, fecha_actualizacion: today });
    }

    // 6.1.1: solo egresados aprobados pueden activar.
    if (!(await this.isApprovedGraduate(userId))) {
      throw new ForbiddenException(
        'Solo los egresados aprobados pueden activar su participación como mentores',
      );
    }

    // 6.1.2: activar NO implica aprobación administrativa; solo esta_activo = true.
    if (existing) {
      const changes: Partial<Mentor> = { esta_activo: true, fecha_actualizacion: today };
      if (dto.experiencia !== undefined) changes.experiencia = dto.experiencia;
      if (dto.anios_exp !== undefined) changes.anios_exp = dto.anios_exp;
      return this.update(userId, changes);
    }

    // 6.1.3: PK = UUID del usuario => un solo registro por usuario.
    const { data, error } = await supabase
      .from('mentor')
      .insert({
        id: userId,
        esta_activo: true,
        experiencia: dto.experiencia ?? null,
        anios_exp: dto.anios_exp ?? null,
        fecha_creacion: today,
        fecha_actualizacion: today,
      })
      .select('*')
      .single();

    if (error) {
      // Concurrencia: dos requests creando el mismo registro a la vez.
      if (error.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('El usuario ya tiene un registro de mentor');
      }
      this.fail(error);
    }
    return data as Mentor;
  }

  /** PATCH /mentorship/deactivate/:userId */
  async deactivateByAdmin(userId: string): Promise<Mentor> {
    if (!(await this.findById(userId))) {
      throw new NotFoundException('Mentor no encontrado');
    }
    return this.update(userId, { esta_activo: false, fecha_actualizacion: this.today() });
  }

  /** POST /mentorship/profiles/reset (solo desarrollo, NO borra) */
  async resetMyProfile(userId: string): Promise<Mentor> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Endpoint deshabilitado en producción');
    }
    return this.deactivateByAdmin(userId);
  }

  // ---------- helpers privados ----------

  private async findById(userId: string): Promise<Mentor | null> {
    const { data, error } = await supabase
      .from('mentor')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) this.fail(error);
    return (data as Mentor | null) ?? null;
  }

  private async ensureActiveMentor(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('mentor')
      .select('id, esta_activo')
      .eq('id', userId)
      .maybeSingle();
    if (error) this.fail(error);
    if (!data || data.esta_activo !== true) {
      throw new ForbiddenException({
        code: 'MENTOR_PROFILE_INACTIVE',
        message: 'Se requiere un perfil de mentor activo para consultar o modificar sus áreas',
      });
    }
  }

  private async update(userId: string, changes: Partial<Mentor>): Promise<Mentor> {
    const { data, error } = await supabase
      .from('mentor')
      .update(changes)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) this.fail(error);
    return data as Mentor;
  }

  private fail(error: PostgrestError): never {
    throw new InternalServerErrorException(error.message);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

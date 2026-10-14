import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
// Cliente compartido del equipo (única línea a ajustar si exporta otro nombre).
import { supabase } from '../../shared/lib/supabase';
import { AddInterestsDto } from './dto/add-interests.dto';
import {
  Area,
  AreaResumen,
  InterestCatalogGroup,
  MentorArea,
  MentorInterest,
  RemovedInterest,
} from './mentorship-interests.model';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Interés del catálogo junto con su área padre (regla 1). */
interface InterestWithParent {
  interest: Area;
  parent: Area;
}

/**
 * HU-03: intereses específicos de mentoría (catálogo controlado de `area`).
 * No inyecta MentorshipService para no crear dependencia circular: MentorshipService
 * usa este servicio para removeInterestsByArea (regla 7).
 */
@Injectable()
export class MentorshipInterestsService {
  /** GET /mentorship/interests/catalog */
  async getCatalog(mentorId: string): Promise<InterestCatalogGroup[]> {
    // Regla 2: el mentor debe existir en la tabla mentor.
    await this.requireMentor(mentorId);

    // Regla 1: solo intereses de las áreas raíz activas del mentor.
    const roots = (await this.findAreas([...(await this.mentorAreaIds(mentorId))])).filter(
      (a) => a.padre_id === null && a.esta_activo === true,
    );
    if (roots.length === 0) return [];

    const { data, error } = await supabase
      .from('area')
      .select('*')
      .in('padre_id', roots.map((r) => r.id))
      .eq('esta_activo', true)
      .order('nombre', { ascending: true });
    if (error) this.fail(error);
    const interests = (data ?? []) as Area[];

    // Marca los que el mentor ya seleccionó (misma tabla mentor_area).
    const selected = await this.mentorAreaIds(mentorId);
    const rootById = new Map(roots.map((r) => [r.id, r]));

    const groups = new Map<string, InterestCatalogGroup>();
    for (const root of roots) {
      groups.set(root.id, { area: this.toResumen(root), intereses: [] });
    }
    for (const interest of interests) {
      const parent = interest.padre_id ? rootById.get(interest.padre_id) : undefined;
      if (!parent) continue;
      groups.get(parent.id)?.intereses.push({
        ...this.toInterest(interest, parent),
        seleccionado: selected.has(interest.id),
      });
    }

    return [...groups.values()].sort((a, b) => a.area.nombre.localeCompare(b.area.nombre));
  }

  /** GET /mentorship/interests/mine */
  async getMyInterests(mentorId: string): Promise<MentorInterest[]> {
    // Regla 2: el mentor debe existir en la tabla mentor.
    await this.requireMentor(mentorId);

    const ownAreaIds = await this.mentorAreaIds(mentorId);
    if (ownAreaIds.size === 0) return [];

    // Regla 1: solo cuenta como interés el área con padre_id no nulo.
    const interests = (await this.findAreas([...ownAreaIds])).filter((a) => a.padre_id !== null);
    if (interests.length === 0) return [];

    const parentById = new Map(
      (await this.findAreas(interests.map((i) => i.padre_id))).map((p) => [p.id, p]),
    );

    return interests
      .map((interest) => {
        const parent = interest.padre_id ? parentById.get(interest.padre_id) : undefined;
        return parent ? this.toInterest(interest, parent) : null;
      })
      .filter((item): item is MentorInterest => item !== null)
      .sort(
        (a, b) =>
          a.area.nombre.localeCompare(b.area.nombre) || a.nombre.localeCompare(b.nombre),
      );
  }

  /** POST /mentorship/interests */
  async addInterests(mentorId: string, dto: AddInterestsDto): Promise<MentorInterest[]> {
    // Regla 2: el mentor debe existir en la tabla mentor.
    await this.requireMentor(mentorId);

    // Regla 6: solo IDs del catálogo (validación defensiva, sin ValidationPipe global).
    const ids = this.normalizeIds(dto?.ids);

    // Regla 5: sin duplicados dentro del mismo request (409).
    const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (repetidos.length > 0) {
      throw new ConflictException(`Interés repetido en la solicitud: ${repetidos.join(', ')}`);
    }

    // Regla 1 y 6: cada id debe ser un interés activo de un área raíz activa.
    const catalog = await this.findInterests(ids);

    // Regla 3: el área padre del interés debe estar asignada al mentor.
    const ownAreaIds = await this.mentorAreaIds(mentorId);
    for (const { interest, parent } of catalog) {
      if (!ownAreaIds.has(parent.id)) {
        throw new ForbiddenException(
          `No puedes seleccionar el interés "${this.label(interest)}" porque su área ` +
            `"${this.label(parent)}" no está asignada a tu perfil`,
        );
      }
    }

    // Regla 5: sin duplicados contra lo ya guardado (mentor_area no tiene UNIQUE).
    const { data: saved, error: savedError } = await supabase
      .from('mentor_area')
      .select('id_area')
      .eq('id_mentor', mentorId)
      .in('id_area', ids);
    if (savedError) this.fail(savedError);
    const alreadySaved = new Set(
      ((saved ?? []) as Array<Pick<MentorArea, 'id_area'>>).map((r) => r.id_area),
    );
    const duplicated = ids.filter((id) => alreadySaved.has(id));
    if (duplicated.length > 0) {
      throw new ConflictException(`El mentor ya tiene seleccionado el interés: ${duplicated.join(', ')}`);
    }

    // HU-03: un solo insert en lote.
    const { error } = await supabase.from('mentor_area').insert(
      ids.map((id) => ({ id_mentor: mentorId, id_area: id, fecha_creacion: this.today() })),
    );
    if (error) this.fail(error);

    return catalog.map(({ interest, parent }) => this.toInterest(interest, parent));
  }

  /** DELETE /mentorship/interests/:interestId */
  async removeInterest(mentorId: string, interestId: string): Promise<RemovedInterest> {
    // Regla 2: el mentor debe existir en la tabla mentor.
    await this.requireMentor(mentorId);

    const [area] = await this.findAreas([interestId]);
    if (!area) {
      // Regla 6: un id fuera del catálogo no es válido.
      throw new NotFoundException('Interés no encontrado en el catálogo');
    }
    // Regla 1: un área técnica no se quita por aquí, solo intereses.
    if (area.padre_id === null) {
      throw new BadRequestException(`"${this.label(area)}" es un área técnica, no un interés`);
    }

    const { data, error } = await supabase
      .from('mentor_area')
      .delete()
      .eq('id_mentor', mentorId)
      .eq('id_area', interestId)
      .select('id');
    if (error) this.fail(error);
    if (!data || data.length === 0) {
      throw new NotFoundException('El mentor no tiene seleccionado ese interés');
    }
    return { id: interestId, eliminado: true };
  }

  /**
   * Regla 7: al quitarle un área al mentor deben borrarse sus intereses hijos.
   * Lo consume el módulo que gestiona las áreas (este servicio no toca el área).
   * Devuelve la cantidad de intereses eliminados.
   */
  async removeInterestsByArea(mentorId: string, areaId: string): Promise<number> {
    const { data, error } = await supabase.from('area').select('id').eq('padre_id', areaId);
    if (error) this.fail(error);
    const childIds = ((data ?? []) as Array<Pick<Area, 'id'>>).map((a) => a.id);
    if (childIds.length === 0) return 0;

    const { data: removed, error: removeError } = await supabase
      .from('mentor_area')
      .delete()
      .eq('id_mentor', mentorId)
      .in('id_area', childIds)
      .select('id');
    if (removeError) this.fail(removeError);
    return removed?.length ?? 0;
  }

  // ---------- helpers privados ----------

  /** Regla 2: el mentor debe existir en la tabla mentor (404 si no). */
  private async requireMentor(mentorId: string): Promise<void> {
    const { data, error } = await supabase
      .from('mentor')
      .select('id')
      .eq('id', mentorId)
      .maybeSingle();
    if (error) this.fail(error);
    if (!data) {
      throw new NotFoundException('El usuario no tiene perfil de mentor');
    }
  }

  /**
   * Regla 1 y 6: carga los intereses pedidos y valida que cada uno sea un `area`
   * activo con padre_id no nulo, cuyo padre sea un área raíz activa.
   */
  private async findInterests(ids: string[]): Promise<InterestWithParent[]> {
    const areaById = new Map((await this.findAreas(ids)).map((a) => [a.id, a]));

    // Regla 6: un id inexistente en el catálogo se rechaza.
    const unknown = ids.filter((id) => !areaById.has(id));
    if (unknown.length > 0) {
      throw new BadRequestException(`Interés inexistente en el catálogo: ${unknown.join(', ')}`);
    }

    const interests = ids.map((id) => areaById.get(id));

    // Regla 1: el interés debe tener área padre (un área técnica no es un interés).
    const sinPadre = interests.filter((a) => !a.padre_id);
    if (sinPadre.length > 0) {
      throw new BadRequestException(
        `Solo se aceptan intereses, no áreas técnicas: ${sinPadre.map((a) => this.label(a)).join(', ')}`,
      );
    }

    const parentById = new Map(
      (await this.findAreas(interests.map((a) => a.padre_id))).map((p) => [p.id, p]),
    );

    return interests.map((interest) => {
      const parent = parentById.get(interest.padre_id);
      // Regla 1: el padre debe ser un área raíz (catálogo de dos niveles).
      if (!parent || parent.padre_id !== null) {
        throw new BadRequestException(
          `El interés "${this.label(interest)}" no pertenece a un área raíz del catálogo`,
        );
      }
      // Regla 1: interés y área deben estar activos.
      if (interest.esta_activo !== true || parent.esta_activo !== true) {
        throw new BadRequestException(
          `El interés "${this.label(interest)}" o su área "${this.label(parent)}" no están activos`,
        );
      }
      return { interest, parent };
    });
  }

  /** Carga filas de `area` por id en una sola consulta (ids sin repetir). */
  private async findAreas(ids: string[]): Promise<Area[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const { data, error } = await supabase.from('area').select('*').in('id', unique);
    if (error) this.fail(error);
    return (data ?? []) as Area[];
  }

  /** Áreas (raíces e intereses) que el mentor tiene en mentor_area. */
  private async mentorAreaIds(mentorId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('mentor_area')
      .select('id_area')
      .eq('id_mentor', mentorId);
    if (error) this.fail(error);
    return new Set(((data ?? []) as Array<Pick<MentorArea, 'id_area'>>).map((r) => r.id_area));
  }

  /** Regla 6: el body solo puede traer IDs válidos (sin ValidationPipe global). */
  private normalizeIds(ids: string[]): string[] {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Debe enviar al menos un id de interés');
    }
    const invalid = ids.filter((id) => typeof id !== 'string' || !UUID_REGEX.test(id));
    if (invalid.length > 0) {
      throw new BadRequestException(`Ids de interés inválidos: ${invalid.join(', ')}`);
    }
    return ids.map((id) => id.toLowerCase());
  }

  private toResumen(area: Area): AreaResumen {
    return { id: area.id, nombre: area.nombre ?? '' };
  }

  /** Regla 8: toda respuesta de interés lleva id, nombre y área padre. */
  private toInterest(interest: Area, parent: Area): MentorInterest {
    return { id: interest.id, nombre: interest.nombre ?? '', area: this.toResumen(parent) };
  }

  private label(area: Area): string {
    return area.nombre ?? area.id;
  }

  private fail(error: PostgrestError): never {
    throw new InternalServerErrorException(error.message);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

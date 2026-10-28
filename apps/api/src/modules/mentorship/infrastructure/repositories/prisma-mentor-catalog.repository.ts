import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { MentorCatalogRepository } from '../../application/ports/mentor-catalog-repository.port';
import { assertDistinctInterests } from '../../domain/policies/mentor.policy';
import { lockOwnMentor } from './mentor-transaction';
import { linkedAreaInclude, readMentorAreas, requireOwnMentor } from './mentor-catalog-reader';

@Injectable()
export class PrismaMentorCatalogRepository implements MentorCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async areas(userId: string) {
    const mentor = await requireOwnMentor(this.prisma, userId, true);
    return readMentorAreas(this.prisma, mentor.id);
  }

  async setAreas(userId: string, ids: string[]) {
    return this.prisma.$transaction(
      async (tx) => {
        const mentor = await lockOwnMentor(tx, userId, true);
        const roots = await tx.area.findMany({
          where: { id: { in: ids }, padre_id: null, esta_activo: true },
          select: { id: true },
        });
        if (roots.length !== ids.length) {
          throw new BusinessRuleError(
            'invalid',
            'AREA_INVALID',
            'Selecciona únicamente áreas raíz activas del catálogo',
          );
        }
        const links = await tx.mentorArea.findMany({
          where: { id_mentor: mentor.id },
          include: linkedAreaInclude,
        });
        const selected = new Set(ids);
        const retained = new Set<string>();
        const removed: string[] = [];
        for (const link of links) {
          const area = link.area;
          if (
            !area ||
            (area.padre_id === null ? !selected.has(area.id) : !selected.has(area.padre_id)) ||
            retained.has(area.id)
          ) {
            removed.push(link.id);
          } else {
            retained.add(area.id);
          }
        }
        if (removed.length) {
          await tx.mentorArea.deleteMany({ where: { id: { in: removed }, id_mentor: mentor.id } });
        }
        const added = ids.filter((id) => !retained.has(id));
        if (added.length) {
          await tx.mentorArea.createMany({
            data: added.map((id) => ({
              id_mentor: mentor.id,
              id_area: id,
              fecha_creacion: new Date(),
            })),
          });
        }
        return readMentorAreas(tx, mentor.id);
      },
      { timeout: 15000 },
    );
  }

  async interestCatalog(userId: string) {
    const mentor = await requireOwnMentor(this.prisma, userId);
    const links = await this.prisma.mentorArea.findMany({
      where: { id_mentor: mentor.id },
      include: linkedAreaInclude,
    });
    const roots = links.flatMap((link) =>
      link.area?.padre_id === null && link.area.esta_activo ? [link.area] : [],
    );
    const selected = new Set(links.map((link) => link.id_area));
    const children = await this.prisma.area.findMany({
      where: { padre_id: { in: roots.map((root) => root.id) }, esta_activo: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
    return roots
      .sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'))
      .map((root) => ({
        area: { id: root.id, name: root.nombre ?? '' },
        interests: children
          .filter((child) => child.padre_id === root.id)
          .map((child) => ({
            id: child.id,
            name: child.nombre ?? '',
            area: { id: root.id, name: root.nombre ?? '' },
            selected: selected.has(child.id),
          })),
      }));
  }

  async interests(userId: string) {
    const mentor = await requireOwnMentor(this.prisma, userId);
    return (await readMentorAreas(this.prisma, mentor.id)).interests;
  }

  async addInterests(userId: string, ids: string[]) {
    assertDistinctInterests(ids);
    return this.prisma.$transaction(
      async (tx) => {
        const mentor = await lockOwnMentor(tx, userId);
        const [interests, links] = await Promise.all([
          tx.area.findMany({ where: { id: { in: ids } }, include: { padre: true } }),
          tx.mentorArea.findMany({ where: { id_mentor: mentor.id }, select: { id_area: true } }),
        ]);
        if (
          interests.length !== ids.length ||
          interests.some(
            (interest) =>
              !interest.esta_activo ||
              !interest.padre ||
              !interest.padre.esta_activo ||
              interest.padre.padre_id !== null,
          )
        ) {
          throw new BusinessRuleError(
            'invalid',
            'INTEREST_INVALID',
            'Selecciona intereses activos de áreas raíz activas',
          );
        }
        const selected = new Set(links.map((link) => link.id_area));
        if (interests.some((interest) => !selected.has(interest.padre_id!))) {
          throw new BusinessRuleError(
            'forbidden',
            'INTEREST_AREA_NOT_SELECTED',
            'El área del interés no está asignada a tu perfil',
          );
        }
        if (ids.some((id) => selected.has(id))) {
          throw new BusinessRuleError(
            'conflict',
            'INTEREST_ALREADY_SELECTED',
            'El perfil ya tiene seleccionado ese interés',
          );
        }
        await tx.mentorArea.createMany({
          data: ids.map((id) => ({
            id_mentor: mentor.id,
            id_area: id,
            fecha_creacion: new Date(),
          })),
        });
        return interests.map((interest) => ({
          id: interest.id,
          name: interest.nombre ?? '',
          area: { id: interest.padre!.id, name: interest.padre!.nombre ?? '' },
        }));
      },
      { timeout: 15000 },
    );
  }

  async removeInterest(userId: string, id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const mentor = await lockOwnMentor(tx, userId);
        const interest = await tx.area.findUnique({ where: { id }, select: { padre_id: true } });
        if (!interest) {
          throw new BusinessRuleError('missing', 'INTEREST_NOT_FOUND', 'El interés no existe');
        }
        if (!interest.padre_id) {
          throw new BusinessRuleError(
            'invalid',
            'INTEREST_INVALID',
            'Un área raíz no se elimina como interés',
          );
        }
        const removed = await tx.mentorArea.deleteMany({
          where: { id_mentor: mentor.id, id_area: id },
        });
        if (!removed.count) {
          throw new BusinessRuleError(
            'missing',
            'INTEREST_NOT_SELECTED',
            'El perfil no tiene seleccionado ese interés',
          );
        }
      },
      { timeout: 15000 },
    );
  }
}

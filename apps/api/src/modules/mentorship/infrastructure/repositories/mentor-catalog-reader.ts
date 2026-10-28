import type { Prisma } from '../../../../generated/prisma/client';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { MentorInterest } from '../../domain/entities/mentor';
import { mentorMissing } from './mentor-transaction';

export async function requireOwnMentor(
  db: Prisma.TransactionClient,
  userId: string,
  active = false,
) {
  const row = await db.mentor.findFirst({
    where: { titulado: { id_usuario: userId } },
    select: { id: true, esta_activo: true },
  });
  if (!row) {
    return mentorMissing();
  }
  if (active && row.esta_activo !== true) {
    throw new BusinessRuleError(
      'forbidden',
      'MENTOR_INACTIVE',
      'Se requiere un perfil de mentor activo',
    );
  }
  return row;
}

export const linkedAreaInclude = {
  area: {
    include: { padre: { select: { id: true, nombre: true, padre_id: true, esta_activo: true } } },
  },
};

export async function readMentorAreas(db: Prisma.TransactionClient, mentorId: string) {
  const [catalog, links] = await Promise.all([
    db.area.findMany({
      where: { padre_id: null, esta_activo: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      select: { id: true, nombre: true },
    }),
    db.mentorArea.findMany({ where: { id_mentor: mentorId }, include: linkedAreaInclude }),
  ]);
  const interests: MentorInterest[] = links.flatMap((link) =>
    link.area?.padre
      ? [
          {
            id: link.area.id,
            name: link.area.nombre ?? '',
            area: { id: link.area.padre.id, name: link.area.padre.nombre ?? '' },
          },
        ]
      : [],
  );
  return {
    catalog: catalog.map((area) => ({ id: area.id, name: area.nombre ?? '' })),
    selectedIds: [
      ...new Set(
        links.flatMap((link) => (link.area && link.area.padre_id === null ? [link.area.id] : [])),
      ),
    ],
    interests: interests.sort(
      (a, b) => a.area.name.localeCompare(b.area.name, 'es') || a.name.localeCompare(b.name, 'es'),
    ),
  };
}

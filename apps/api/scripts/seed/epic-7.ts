import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_ACCOUNTS } from './demo-accounts';
import { DEMO_IDS } from './demo-ids';

// Las fechas se calculan al crear cada fila; repetir la seed no reprograma eventos existentes.
function nextEventDate(days: number, hour: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

export const eventos: Array<Prisma.EventoCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.publicEvent,
    id_usuario: DEMO_ACCOUNTS[1].id,
    titulo: 'Encuentro de titulados - Demostración',
    descripcion: 'Evento ficticio para probar el catálogo, los cupos y las fechas.',
    fecha_inicio: nextEventDate(30, 18),
    fecha_fin: nextEventDate(30, 20),
    cupo_maximo: 40,
    ubicacion: 'Auditorio de demostración, Cochabamba',
    estado: 'PUBLICADO',
    fecha_creacion: new Date(),
  },
  {
    id: DEMO_IDS.draftEvent,
    id_usuario: DEMO_ACCOUNTS[1].id,
    titulo: 'Taller de empleabilidad - Borrador de demostración',
    descripcion: 'Borrador para probar edición y publicación desde la administración.',
    fecha_inicio: nextEventDate(45, 18),
    fecha_fin: nextEventDate(45, 20),
    cupo_maximo: 25,
    ubicacion: 'Aula de demostración',
    estado: 'BORRADOR',
    fecha_creacion: new Date(),
  },
];
export const inscripciones: Array<Prisma.InscripcionEventoCreateManyInput & { id: string }> = [
  {
    id: '77100000-0000-4000-8000-000000000001',
    id_evento: DEMO_IDS.publicEvent,
    id_usuario: DEMO_ACCOUNTS[0].id,
    fecha_inscripcion: new Date(),
    estado: 'CONFIRMADA',
  },
];

export async function seedEpic7(prisma: PrismaClient): Promise<void> {
  if (eventos.length > 0) {
    await prisma.evento.createMany({ data: eventos, skipDuplicates: true });
  }
  if (inscripciones.length > 0) {
    await prisma.inscripcionEvento.createMany({ data: inscripciones, skipDuplicates: true });
  }
}

import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_GRADUATE_ID } from './demo-accounts';
import { AREA_IDS } from './demo-ids';

export const perfilesArea: Array<Prisma.PerfilAreaCreateManyInput & { id: string }> = [
  {
    id: '33000000-0000-4000-8000-000000000010',
    id_titulado: DEMO_GRADUATE_ID,
    area_id: AREA_IDS.technology,
    descripcion_profesional:
      'Desarrollo aplicaciones con TypeScript y PostgreSQL. Participo en gestión de proyectos.',
    fecha_creacion: new Date(),
  },
];

export async function seedEpic3(prisma: PrismaClient): Promise<void> {
  if (perfilesArea.length > 0) {
    await prisma.perfilArea.createMany({
      data: perfilesArea,
      skipDuplicates: true,
    });
  }
}

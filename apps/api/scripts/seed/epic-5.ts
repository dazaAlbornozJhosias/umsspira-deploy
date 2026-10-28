import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_COMPANY_ID } from './demo-accounts';
import { DEMO_IDS } from './demo-ids';

export const vacantes: Array<Prisma.VacanteCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.vacancy,
    id_empresa: DEMO_COMPANY_ID,
    titulo: 'Desarrollador web junior',
    modalidad: 'HIBRIDO',
    nivel_experiencia: 'JUNIOR',
    descripcion_tecnica: 'Vacante ficticia: TypeScript, PostgreSQL y fundamentos de pruebas.',
    salario: '4500',
    estado: 'PUBLICADO',
    created_at: new Date(),
  },
];
export const relaciones: Prisma.VacanteRequerimientoLaboralCreateManyInput[] = [
  { id_vacante: DEMO_IDS.vacancy, id_requerimiento_laboral: DEMO_IDS.requirement },
];

export async function seedEpic5(prisma: PrismaClient): Promise<void> {
  if (vacantes.length > 0) {
    await prisma.vacante.createMany({ data: vacantes, skipDuplicates: true });
  }
  await prisma.vacanteRequerimientoLaboral.createMany({ data: relaciones, skipDuplicates: true });
}

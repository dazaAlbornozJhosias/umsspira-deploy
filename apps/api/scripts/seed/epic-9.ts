import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_ADMIN_ASSIGNMENT_ID, DEMO_CAREER_ID } from './demo-accounts';

// Los reportes HTTP se generan con las solicitudes de la épica 1; no son archivos estáticos.
export const reportes: Array<Prisma.ReporteCreateManyInput & { id: string }> = [];
export const encuestas: Array<Prisma.EncuestaCreateManyInput & { id: string }> = [
  {
    id: '99000000-0000-4000-8000-000000000001',
    id_administrador: DEMO_ADMIN_ASSIGNMENT_ID,
    id_carrera: DEMO_CAREER_ID,
    titulo: 'Seguimiento laboral - Demostración',
    fecha_inicio: new Date('2026-01-01T00:00:00Z'),
    fecha_fin: new Date('2026-12-31T00:00:00Z'),
    fecha_creacion: new Date(),
    estado: 'BORRADOR',
    formato: 'WEB',
  },
];

export async function seedEpic9(prisma: PrismaClient): Promise<void> {
  if (reportes.length > 0) {
    await prisma.reporte.createMany({ data: reportes, skipDuplicates: true });
  }
  if (encuestas.length > 0) {
    await prisma.encuesta.createMany({ data: encuestas, skipDuplicates: true });
  }
}

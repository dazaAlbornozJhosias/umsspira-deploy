import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { seedAccessCatalog } from './access-catalog';
import { DEMO_CAREER_ID } from './demo-accounts';
import { AREA_IDS, CATALOG_IDS } from './demo-ids';
import { seedRadarCatalog } from './radar-catalog';
import { runSeedStage } from './seed-stage';
import { seedInformaticsCareer } from './informatics-career';

export const carreras: Array<Prisma.CarreraCreateManyInput & { id: string }> = [
  { id: DEMO_CAREER_ID, nombre: 'Ingeniería de Sistemas' },
];

export const tiposArchivo: Array<Prisma.TipoArchivoCreateManyInput & { id: string }> = [
  { id: CATALOG_IDS.pdf, nombre: 'PDF' },
  { id: CATALOG_IDS.jpg, nombre: 'JPG' },
  { id: CATALOG_IDS.png, nombre: 'PNG' },
];

export const modalidades: Array<Prisma.ModalidadTrabajoCreateManyInput & { id: string }> = [
  { id: CATALOG_IDS.onsite, nombre: 'Presencial' },
  { id: CATALOG_IDS.remote, nombre: 'Remoto' },
  { id: CATALOG_IDS.hybrid, nombre: 'Híbrido' },
];

// N28: valores de la copia; las etiquetas largas del Radar no pertenecen a esta tabla.
export const areas: Array<Prisma.AreaCreateManyInput & { id: string }> = [
  { id: AREA_IDS.technology, nombre: 'Tecnología', padre_id: null },
  { id: AREA_IDS.management, nombre: 'Gestión', padre_id: null },
  { id: AREA_IDS.software, nombre: 'Desarrollo de software', padre_id: null },
  { id: AREA_IDS.data, nombre: 'Análisis de datos', padre_id: AREA_IDS.technology },
  { id: AREA_IDS.projects, nombre: 'Gestión de proyectos', padre_id: AREA_IDS.management },
  { id: AREA_IDS.cloudDevops, nombre: 'Cloud/DevOps', padre_id: null },
  { id: AREA_IDS.dataAi, nombre: 'Ciencia de Datos/IA', padre_id: null },
  { id: AREA_IDS.qualityAssurance, nombre: 'QA', padre_id: null },
  { id: AREA_IDS.cybersecurityNetworks, nombre: 'Ciberseguridad', padre_id: null },
  { id: AREA_IDS.itManagement, nombre: 'Gestión TI', padre_id: null },
];

export const tiposReporte: Array<Prisma.TipoReporteCreateManyInput & { id: string }> = [
  {
    id: CATALOG_IDS.graduateReport,
    nombre: 'Listado de titulados',
    descripcion: 'Solicitudes por carrera y estado de revisión documental',
    disponibilidad: true,
  },
];

export async function seedAreas(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Crear faltantes sin renombrar, reubicar ni reactivar registros existentes.
    for (const area of areas) {
      await tx.area.upsert({
        where: { id: area.id },
        create: { ...area, esta_activo: true, fecha_creacion: new Date() },
        update: {},
      });
    }
  }, { maxWait: 10000, timeout: 120000 });
}

export async function seedCatalogs(prisma: PrismaClient): Promise<void> {
  // Acceso conserva su transacción y semántica; T1.9 usa el script dirigido.
  await runSeedStage('acceso', () => seedAccessCatalog(prisma));
  await runSeedStage('catálogos auxiliares', async () => {
    await prisma.$transaction([
      prisma.carrera.createMany({ data: carreras, skipDuplicates: true }),
      prisma.tipoArchivo.createMany({ data: tiposArchivo, skipDuplicates: true }),
      prisma.modalidadTrabajo.createMany({ data: modalidades, skipDuplicates: true }),
      prisma.tipoReporte.createMany({ data: tiposReporte, skipDuplicates: true }),
    ]);
    await seedInformaticsCareer(prisma);
  });
  await runSeedStage('áreas', () => seedAreas(prisma));
  await runSeedStage('diccionario Radar', () => seedRadarCatalog(prisma));
}

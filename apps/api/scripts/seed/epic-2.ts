import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_GRADUATE_ID } from './demo-accounts';
import { DEMO_IDS } from './demo-ids';

// Perfil demo de la Épica 2 (Carlos Mendoza Ríos). Los textos son exactos: los usan
// las pruebas de punta a punta de las Épicas 2 y 3.
export const formaciones: Array<Prisma.FormacionAcademicaCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.education,
    id_titulado: DEMO_GRADUATE_ID,
    institucion: 'Universidad Mayor de San Simón',
    titulo: 'Ingeniería de Sistemas',
    grado: 'Licenciatura',
    anio_egreso: 2018,
  },
  {
    id: '22000000-0000-4000-8000-000000000010',
    id_titulado: DEMO_GRADUATE_ID,
    institucion: 'Universidad Católica Boliviana',
    titulo: 'Gestión de TI',
    grado: 'Maestría',
    anio_egreso: 2021,
  },
];
export const respaldosFormacion: Array<Prisma.FormacionRespaldoCreateManyInput & { id: string }> =
  [];
export const experiencias: Array<Prisma.ExperienciaLaboralCreateManyInput & { id: string }> = [
  {
    id: '22000000-0000-4000-8000-000000000002',
    id_titulado: DEMO_GRADUATE_ID,
    empresa: 'NTT DATA',
    cargo: 'Tech Lead',
    fecha_inicio: new Date('2023-07-01T00:00:00Z'),
    fecha_fin: null,
  },
  {
    id: '22000000-0000-4000-8000-000000000011',
    id_titulado: DEMO_GRADUATE_ID,
    empresa: 'Jalasoft',
    cargo: 'Desarrollador Senior',
    fecha_inicio: new Date('2021-01-01T00:00:00Z'),
    fecha_fin: new Date('2023-06-30T00:00:00Z'),
  },
  {
    id: '22000000-0000-4000-8000-000000000012',
    id_titulado: DEMO_GRADUATE_ID,
    empresa: 'Banco Mercantil Santa Cruz',
    cargo: 'Analista de Sistemas',
    fecha_inicio: new Date('2019-01-01T00:00:00Z'),
    fecha_fin: new Date('2020-12-31T00:00:00Z'),
  },
];
export const certificaciones: Array<Prisma.CertificacionCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.certification,
    id_titulado: DEMO_GRADUATE_ID,
    nombre: 'AWS Solutions Architect',
    entidad_emisora: 'Amazon Web Services',
    grado: 'Profesional',
    anio_emision: 2022,
    estado_validacion: 'sin_respaldo',
  },
  {
    id: '22000000-0000-4000-8000-000000000013',
    id_titulado: DEMO_GRADUATE_ID,
    nombre: 'Scrum Master PSM I',
    entidad_emisora: 'Scrum.org',
    grado: 'Asociado',
    anio_emision: 2021,
    estado_validacion: 'sin_respaldo',
  },
  {
    id: '22000000-0000-4000-8000-000000000014',
    id_titulado: DEMO_GRADUATE_ID,
    nombre: 'Google Cloud Engineer',
    entidad_emisora: 'Google',
    grado: 'Profesional',
    anio_emision: 2023,
    estado_validacion: 'sin_respaldo',
  },
];
// Los respaldos JPG de AWS y Scrum se suben con el endpoint de archivos; Google Cloud queda sin respaldo.
export const respaldos: Array<Prisma.CertificacionRespaldoCreateManyInput & { id: string }> = [];
// Las validaciones necesitan certificaciones y administradores de sistema ya cargados.
export const validaciones: Array<Prisma.ValidacionCertificacionCreateManyInput & { id: string }> =
  [];

export async function seedEpic2(prisma: PrismaClient): Promise<void> {
  if (formaciones.length > 0) {
    await prisma.formacionAcademica.createMany({ data: formaciones, skipDuplicates: true });
  }
  if (respaldosFormacion.length > 0) {
    await prisma.formacionRespaldo.createMany({ data: respaldosFormacion, skipDuplicates: true });
  }
  if (experiencias.length > 0) {
    await prisma.experienciaLaboral.createMany({ data: experiencias, skipDuplicates: true });
  }
  if (certificaciones.length > 0) {
    await prisma.certificacion.createMany({ data: certificaciones, skipDuplicates: true });
  }
  if (respaldos.length > 0) {
    await prisma.certificacionRespaldo.createMany({ data: respaldos, skipDuplicates: true });
  }
  if (validaciones.length > 0) {
    await prisma.validacionCertificacion.createMany({ data: validaciones, skipDuplicates: true });
  }
}

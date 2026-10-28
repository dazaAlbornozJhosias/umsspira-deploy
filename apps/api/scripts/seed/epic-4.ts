import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_COMPANY_ID } from './demo-accounts';
import { AREA_IDS, CATALOG_IDS, DEMO_IDS } from './demo-ids';

// Portal de empresas: añadir datos con UUID fijos y referencias a registros ya cargados.
export const empresas: Array<Prisma.EmpresaCreateManyInput & { id: string }> = [];
export const requerimientos: Array<Prisma.RequerimientoLaboralCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.requirement,
    id_empresa: DEMO_COMPANY_ID,
    id_modalidad: CATALOG_IDS.hybrid,
    titulo: 'Desarrollador de aplicaciones web',
    descripcion: 'Requerimiento ficticio: TypeScript, PostgreSQL y trabajo en equipo.',
    experiencia_requerida: 'Junior',
    ubicacion: 'Cochabamba',
    fecha_publicacion: new Date(),
    estado: 'PUBLICADO',
  },
];
export const habilidades: Array<Prisma.RequerimientoHabilidadCreateManyInput & { id: string }> = [
  {
    id: '44100000-0000-4000-8000-000000000001',
    id_requerimiento: DEMO_IDS.requirement,
    id_area: AREA_IDS.software,
    nivel_requerimiento: 'Básico',
  },
];
export const telefonos: Array<Prisma.TelefonoEmpresaCreateManyInput & { id: string }> = [
  {
    id: '44200000-0000-4000-8000-000000000001',
    id_empresa: DEMO_COMPANY_ID,
    numero: '70000001',
    tipo: 'PRINCIPAL',
  },
];
export const direcciones: Array<Prisma.DireccionEmpresaCreateManyInput & { id: string }> = [
  {
    id: '44300000-0000-4000-8000-000000000001',
    id_empresa: DEMO_COMPANY_ID,
    departamento: 'Cochabamba',
    direccion: 'Dirección ficticia de demostración',
  },
];
export const sectores: Array<Prisma.SectorEmpresaCreateManyInput & { id: string }> = [
  {
    id: '44400000-0000-4000-8000-000000000001',
    id_empresa: DEMO_COMPANY_ID,
    nombre: 'Tecnología',
    descripcion: 'Desarrollo de software',
    estado: 'ACTIVO',
  },
];

export async function seedEpic4(prisma: PrismaClient): Promise<void> {
  if (empresas.length > 0) {
    await prisma.empresa.createMany({ data: empresas, skipDuplicates: true });
  }
  await prisma.telefonoEmpresa.createMany({ data: telefonos, skipDuplicates: true });
  await prisma.direccionEmpresa.createMany({ data: direcciones, skipDuplicates: true });
  await prisma.sectorEmpresa.createMany({ data: sectores, skipDuplicates: true });
  if (requerimientos.length > 0) {
    await prisma.requerimientoLaboral.createMany({ data: requerimientos, skipDuplicates: true });
  }
  if (habilidades.length > 0) {
    await prisma.requerimientoHabilidad.createMany({ data: habilidades, skipDuplicates: true });
  }
}

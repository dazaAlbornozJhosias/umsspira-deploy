import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { randomBytes, createHash } from 'node:crypto';
import { DEMO_ACCOUNTS, DEMO_CAREER_ID, DEMO_GRADUATE_ID } from './demo-accounts';
import { CATALOG_IDS, DEMO_IDS } from './demo-ids';
import { demoDocument } from './demo-document';

const now = new Date();
const submittedAt = new Date(now.getTime() - 3 * 86400000);
const reviewedAt = new Date(now.getTime() - 86400000);

const expedientes = [
  {
    id: DEMO_IDS.applications.pending,
    detalleId: '11100000-0000-4000-8000-000000000001',
    documentoId: '11200000-0000-4000-8000-000000000001',
    borradorId: '11300000-0000-4000-8000-000000000001',
    archivoId: '11400000-0000-4000-8000-000000000001',
    dictamenId: '11500000-0000-4000-8000-000000000001',
    nombre: 'Ana',
    apellido: 'Ejemplo',
    email: 'ana.pendiente@example.com',
    ci: '9000011',
    codSis: '202000011',
    estado: 'PENDIENTE',
  },
  {
    id: DEMO_IDS.applications.approved,
    detalleId: '11100000-0000-4000-8000-000000000002',
    documentoId: '11200000-0000-4000-8000-000000000002',
    borradorId: '11300000-0000-4000-8000-000000000002',
    archivoId: '11400000-0000-4000-8000-000000000002',
    dictamenId: '11500000-0000-4000-8000-000000000002',
    nombre: DEMO_ACCOUNTS[0].name,
    apellido: 'UMSSPIRA',
    email: DEMO_ACCOUNTS[0].email,
    ci: '9000001',
    codSis: '202000001',
    estado: 'APROBADA',
  },
  {
    id: DEMO_IDS.applications.observed,
    detalleId: '11100000-0000-4000-8000-000000000003',
    documentoId: '11200000-0000-4000-8000-000000000003',
    borradorId: '11300000-0000-4000-8000-000000000003',
    archivoId: '11400000-0000-4000-8000-000000000003',
    dictamenId: '11500000-0000-4000-8000-000000000003',
    nombre: 'Luis',
    apellido: 'Ejemplo',
    email: 'luis.observado@example.com',
    ci: '9000013',
    codSis: '202000013',
    estado: 'OBSERVADA',
  },
  {
    id: DEMO_IDS.applications.rejected,
    detalleId: '11100000-0000-4000-8000-000000000004',
    documentoId: '11200000-0000-4000-8000-000000000004',
    borradorId: '11300000-0000-4000-8000-000000000004',
    archivoId: '11400000-0000-4000-8000-000000000004',
    dictamenId: '11500000-0000-4000-8000-000000000004',
    nombre: 'María',
    apellido: 'Ejemplo',
    email: 'maria.rechazada@example.com',
    ci: '9000014',
    codSis: '202000014',
    estado: 'RECHAZADA',
  },
] as const;

export const detalles: Array<Prisma.DetalleSolicitudCreateManyInput & { id: string }> =
  expedientes.map((item) => ({
    id: item.detalleId,
    id_carrera: DEMO_CAREER_ID,
    nombre: item.nombre,
    apellido: item.apellido,
    email: item.email,
    ci: item.ci,
    cod_sis: item.codSis,
    telefono: '70000000',
    expedido_en: 'CB',
    fecha_ingreso: new Date('2020-02-01T00:00:00Z'),
    fecha_titulacion: new Date('2025-12-01T00:00:00Z'),
    anio_egreso: 2025,
    desea_mentor: item.estado === 'APROBADA',
  }));

export const documentos: Array<Prisma.DocumentoRespaldoCreateManyInput & { id: string }> =
  expedientes.map((item) => ({
    id: item.documentoId,
    id_tipo_archivo: CATALOG_IDS.pdf,
    ruta_storage: item.archivoId,
    fecha_creacion: submittedAt,
    es_valido: item.estado === 'APROBADA',
  }));

export const solicitudes: Array<Prisma.SolicitudCreateManyInput & { id: string }> = expedientes.map(
  (item, index) => ({
    id: item.id,
    id_detalle_solicitud: item.detalleId,
    id_documento_respaldo: item.documentoId,
    estado: item.estado,
    fecha_creacion: submittedAt,
    fecha_actualizacion: item.estado === 'PENDIENTE' ? submittedAt : reviewedAt,
    fecha_resolucion: item.estado === 'PENDIENTE' ? null : reviewedAt,
    observaciones_count: item.estado === 'OBSERVADA' ? 1 : 0,
    codigo_tit: `DEMO-TIT-${index + 1}`,
    id_titulado: item.estado === 'APROBADA' ? DEMO_GRADUATE_ID : null,
    activada_en: item.estado === 'APROBADA' ? reviewedAt : null,
  }),
);

export const administradoresSistema: Array<
  Prisma.AdministradorSistemaCreateManyInput & { id: string }
> = [{ id: DEMO_IDS.systemAdmin, id_usuario: DEMO_ACCOUNTS[1].id, id_carrera: DEMO_CAREER_ID }];

export const dictamenes: Array<Prisma.DictamenCreateManyInput & { id: string }> = expedientes
  .filter((item) => item.estado !== 'PENDIENTE')
  .map((item) => ({
    id: item.dictamenId,
    id_solicitud: item.id,
    id_administrador_sistema: DEMO_IDS.systemAdmin,
    revisor_id: DEMO_ACCOUNTS[1].id,
    decision: item.estado,
    categoria: item.estado === 'APROBADA' ? null : 'DOCUMENTO',
    justificacion:
      item.estado === 'APROBADA'
        ? null
        : item.estado === 'OBSERVADA'
          ? 'Ejemplo: presentar una copia legible del documento.'
          : 'Ejemplo: el documento presentado no corresponde al trámite.',
    fecha_creacion: reviewedAt,
    subsanada: false,
  }));

export const auditorias: Array<Prisma.AuditoriaCreateManyInput & { id: string }> = [
  {
    id: '11600000-0000-4000-8000-000000000001',
    id_usuario: DEMO_ACCOUNTS[1].id,
    nombre: 'Revisión documental de demostración',
    funcion: 'aprobar_solicitud',
    tabla_afectada: 'solicitud',
    id_registro: DEMO_IDS.applications.approved,
    fecha_hora: reviewedAt,
  },
];

export async function seedEpic1(prisma: PrismaClient): Promise<void> {
  if (detalles.length > 0) {
    await prisma.detalleSolicitud.createMany({ data: detalles, skipDuplicates: true });
  }
  if (documentos.length > 0) {
    await prisma.documentoRespaldo.createMany({ data: documentos, skipDuplicates: true });
  }
  if (solicitudes.length > 0) {
    await prisma.solicitud.createMany({ data: solicitudes, skipDuplicates: true });
  }
  if (administradoresSistema.length > 0) {
    await prisma.administradorSistema.createMany({
      data: administradoresSistema,
      skipDuplicates: true,
    });
  }
  await prisma.dictamen.createMany({ data: dictamenes, skipDuplicates: true });
  await prisma.usuarioSolicitud.createMany({
    data: [
      {
        id_usuario: DEMO_ACCOUNTS[0].id,
        id_solicitud: DEMO_IDS.applications.approved,
        detalle_solicitud_id: expedientes[1].detalleId,
      },
    ],
    skipDuplicates: true,
  });
  for (const item of expedientes) {
    const pdf = await demoDocument(`${item.nombre} ${item.apellido}`);
    // El expediente está enviado y el borrador vencido; no se crean enlaces de acceso reutilizables.
    await prisma.borradorRegistro.createMany({
      data: [
        {
          id: item.borradorId,
          id_solicitud: item.id,
          token_hash: createHash('sha256').update(randomBytes(32)).digest('hex'),
          creado_en: submittedAt,
          expira_en: reviewedAt,
          correo_verificado: true,
          datos: {
            nombres: item.nombre,
            apellidos: item.apellido,
            ci: item.ci,
            complementoCi: '',
            expedidoEn: 'CB',
            correo: item.email,
            telefono: '70000000',
            carreraId: DEMO_CAREER_ID,
            anioEgreso: 2025,
            codigoSis: item.codSis,
          },
        },
      ],
      skipDuplicates: true,
    });
    await prisma.archivoRegistro.createMany({
      data: [
        {
          id: item.archivoId,
          id_borrador: item.borradorId,
          tipo_documento: 'diploma_academico',
          nombre: 'documento-demostracion.pdf',
          mime: 'application/pdf',
          contenido: new Uint8Array(pdf),
          size_bytes: pdf.length,
        },
      ],
      skipDuplicates: true,
    });
  }
  if (auditorias.length > 0) {
    await prisma.auditoria.createMany({ data: auditorias, skipDuplicates: true });
  }
}

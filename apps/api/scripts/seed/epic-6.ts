import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_GRADUATE_ID } from './demo-accounts';
import { AREA_IDS, DEMO_IDS } from './demo-ids';

export const mentores: Array<Prisma.MentorCreateManyInput & { id: string }> = [
  {
    id: DEMO_IDS.mentor,
    id_titulado: DEMO_GRADUATE_ID,
    descripcion: 'Mentor de demostración en desarrollo de software.',
    informacion_relevante: 'Orientación sobre primeros proyectos y búsqueda del primer empleo.',
    experiencia: 'Desarrollo de aplicaciones web con TypeScript y PostgreSQL.',
    esta_activo: true,
    anios_exp: 2,
    fecha_creacion: new Date(),
  },
];
export const especialidades: Array<Prisma.MentorAreaCreateManyInput & { id: string }> = [
  {
    id: '66100000-0000-4000-8000-000000000001',
    id_mentor: DEMO_IDS.mentor,
    id_area: AREA_IDS.technology,
  },
  {
    id: '66100000-0000-4000-8000-000000000002',
    id_mentor: DEMO_IDS.mentor,
    id_area: AREA_IDS.software,
  },
];
export const disponibilidades: Array<Prisma.DisponibilidadMentorCreateManyInput & { id: string }> =
  [
    {
      id: '66200000-0000-4000-8000-000000000001',
      id_mentor: DEMO_IDS.mentor,
      estado: 'DISPONIBLE',
      hora_inicio: new Date('1970-01-01T18:00:00Z'),
      hora_fin: new Date('1970-01-01T20:00:00Z'),
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
  ];
export const espacios: Array<Prisma.EspacioDisponibleMentorCreateManyInput & { id: string }> = [
  {
    id: '66300000-0000-4000-8000-000000000001',
    id_mentor: DEMO_IDS.mentor,
    dia_semana: 2,
    horario_inicio: new Date('1970-01-01T18:00:00Z'),
    horario_fin: new Date('1970-01-01T20:00:00Z'),
    esta_activo: true,
    fecha_creacion: new Date(),
  },
];

export async function seedEpic6(prisma: PrismaClient): Promise<void> {
  if (mentores.length > 0) {
    await prisma.mentor.createMany({ data: mentores, skipDuplicates: true });
  }
  if (especialidades.length > 0) {
    await prisma.mentorArea.createMany({ data: especialidades, skipDuplicates: true });
  }
  await prisma.disponibilidadMentor.createMany({ data: disponibilidades, skipDuplicates: true });
  await prisma.espacioDisponibleMentor.createMany({ data: espacios, skipDuplicates: true });

  const dateOffset = (days: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  };
  const demoRequesters: Array<Prisma.UsuarioCreateManyInput & { usuario_id: string }> = [
    { usuario_id: '66500000-0000-4000-8000-000000000001', nombre: 'Juan Pérez', rol: 'titulado', estado: 'ACTIVO' },
    { usuario_id: '66500000-0000-4000-8000-000000000002', nombre: 'Sofía Gutiérrez Lazo', rol: 'titulado', estado: 'ACTIVO' },
  ];
  await prisma.usuario.createMany({ data: demoRequesters, skipDuplicates: true });

  const demoRequests: Array<Prisma.MentoriaSolicitudCreateManyInput & { id: string }> = [
    {
      id: '66400000-0000-4000-8000-000000000001',
      id_mentor: DEMO_IDS.mentor,
      id_usuario: demoRequesters[0].usuario_id,
      solicitud_fecha: dateOffset(3),
      solicitud_inicio: new Date('1970-01-01T15:00:00Z'),
      solicitud_fin: new Date('1970-01-01T16:00:00Z'),
      mensaje: 'Quisiera orientación para elegir la arquitectura de mi proyecto de grado.',
      estado: 'PENDIENTE',
      fecha_creacion: dateOffset(-1),
      fecha_actualizacion: dateOffset(-1),
    },
    {
      id: '66400000-0000-4000-8000-000000000002',
      id_mentor: DEMO_IDS.mentor,
      id_usuario: demoRequesters[1].usuario_id,
      solicitud_fecha: dateOffset(5),
      solicitud_inicio: new Date('1970-01-01T10:00:00Z'),
      solicitud_fin: new Date('1970-01-01T11:00:00Z'),
      mensaje: 'Me gustaría recibir consejos para prepararme para una entrevista técnica.',
      estado: 'PENDIENTE',
      fecha_creacion: dateOffset(-2),
      fecha_actualizacion: dateOffset(-2),
    },
    {
      id: '66400000-0000-4000-8000-000000000003',
      id_mentor: DEMO_IDS.mentor,
      id_usuario: demoRequesters[0].usuario_id,
      solicitud_fecha: dateOffset(-3),
      solicitud_inicio: new Date('1970-01-01T16:00:00Z'),
      solicitud_fin: new Date('1970-01-01T17:00:00Z'),
      mensaje: 'Revisión de portafolio antes de postular a pasantías.',
      estado: 'ACEPTADO',
      fecha_respuesta: dateOffset(-4),
      fecha_creacion: dateOffset(-7),
      fecha_actualizacion: dateOffset(-4),
    },
    {
      id: '66400000-0000-4000-8000-000000000004',
      id_mentor: DEMO_IDS.mentor,
      id_usuario: demoRequesters[1].usuario_id,
      solicitud_fecha: dateOffset(-5),
      solicitud_inicio: new Date('1970-01-01T09:00:00Z'),
      solicitud_fin: new Date('1970-01-01T10:00:00Z'),
      mensaje: 'Quisiera conversar sobre mi proyecto de automatización.',
      estado: 'RECHAZADO',
      fecha_respuesta: dateOffset(-6),
      fecha_creacion: dateOffset(-9),
      fecha_actualizacion: dateOffset(-6),
    },
    {
      id: '66400000-0000-4000-8000-000000000005',
      id_mentor: DEMO_IDS.mentor,
      id_usuario: demoRequesters[0].usuario_id,
      solicitud_fecha: dateOffset(-8),
      solicitud_inicio: new Date('1970-01-01T17:00:00Z'),
      solicitud_fin: new Date('1970-01-01T18:00:00Z'),
      mensaje: 'Tengo dudas sobre certificaciones en la nube.',
      estado: 'CANCELADO',
      fecha_respuesta: dateOffset(-9),
      fecha_creacion: dateOffset(-11),
      fecha_actualizacion: dateOffset(-9),
    },
  ];
  await prisma.mentoriaSolicitud.createMany({ data: demoRequests, skipDuplicates: true });
}

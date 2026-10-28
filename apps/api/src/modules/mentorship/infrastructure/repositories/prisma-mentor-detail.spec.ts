import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { PrismaMentorRepository } from './prisma-mentor.repository';

const time = (value: string) => new Date(`1970-01-01T${value}:00Z`);
const backend = { id: 'area-back', nombre: 'Backend', padre_id: null, esta_activo: true };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mentor-1',
    id_titulado: 'titulado-1',
    descripcion: 'Mentora backend',
    experiencia: '   ',
    informacion_relevante: null,
    foto_perfil: null,
    esta_activo: true,
    anios_exp: 4,
    fecha_creacion: new Date('2026-10-18'),
    fecha_actualizacion: new Date('2026-10-20'),
    titulado: {
      nombre: 'María',
      apellido: 'Pérez',
      id_carrera: 'carrera-1',
      experiencia_laboral_registros: [{ cargo: 'Backend Developer', empresa: 'Acme' }],
    },
    disponibilidad_mentor_registros: [
      { estado: 'DISPONIBLE', fecha_actualizacion: new Date('2026-10-20') },
    ],
    mentor_area_registros: [
      { area: { ...backend, padre: null } },
      { area: { ...backend, padre: null } },
      {
        area: {
          id: 'interes-nest',
          nombre: 'NestJS',
          padre_id: backend.id,
          esta_activo: true,
          padre: backend,
        },
      },
      {
        area: {
          id: 'interes-huerfano',
          nombre: 'Huérfano',
          padre_id: 'area-inactiva',
          esta_activo: true,
          padre: { id: 'area-inactiva', nombre: 'Inactiva', padre_id: null, esta_activo: false },
        },
      },
    ],
    espacio_disponible_mentor_registros: [
      { dia_semana: 2, horario_inicio: time('18:00'), horario_fin: time('20:00') },
      { dia_semana: 9, horario_inicio: time('08:00'), horario_fin: time('09:00') },
      { dia_semana: 3, horario_inicio: time('10:00'), horario_fin: time('09:00') },
      { dia_semana: 0, horario_inicio: time('09:00'), horario_fin: time('10:00') },
    ],
    ...overrides,
  };
}

describe('PrismaMentorRepository.detail', () => {
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const repository = new PrismaMentorRepository({
    mentor: { findFirst },
    mentoriaSolicitud: { findMany },
  } as unknown as PrismaService);
  const detail = () => repository.detail('mentor-1', '2026-10-23', '2026-10-29');

  beforeEach(() => {
    findFirst.mockReset();
    findMany.mockReset().mockResolvedValue([]);
  });

  it('consulta solo perfiles activos de titulados con cuenta activa', async () => {
    findFirst.mockResolvedValue(null);
    await expect(detail()).resolves.toBeNull();
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: 'mentor-1',
      esta_activo: true,
      titulado: { usuario: { estado: 'ACTIVO', rol: 'titulado' } },
    });
  });

  it('arma el perfil público con áreas, intereses, horarios y cargo actual', async () => {
    findFirst.mockResolvedValue(row());
    const profile = await detail();
    expect(profile).toMatchObject({
      availability: 'DISPONIBLE',
      canRequest: true,
      position: 'Backend Developer',
      company: 'Acme',
      areas: [{ id: 'area-back', name: 'Backend' }],
      interests: [
        { id: 'interes-nest', name: 'NestJS', area: { id: 'area-back', name: 'Backend' } },
      ],
      schedules: [
        { weekday: 2, start: '18:00', end: '20:00' },
        { weekday: 7, start: '09:00', end: '10:00' },
      ],
    });
    expect(profile?.mentor.graduateName).toBe('María Pérez');
    expect(profile?.mentor.experience).toBeNull();
  });

  it('trae las solicitudes pendientes o aceptadas del rango para ocupar horarios', async () => {
    findFirst.mockResolvedValue(row());
    findMany.mockResolvedValue([
      {
        solicitud_fecha: new Date('2026-10-27T00:00:00Z'),
        solicitud_inicio: time('18:00'),
        solicitud_fin: time('19:00'),
      },
      { solicitud_fecha: null, solicitud_inicio: time('08:00'), solicitud_fin: time('09:00') },
    ]);
    const result = await detail();
    expect(findMany.mock.calls[0][0].where).toEqual({
      id_mentor: 'mentor-1',
      estado: { in: ['PENDIENTE', 'ACEPTADO'] },
      solicitud_fecha: {
        gte: new Date('2026-10-23T00:00:00.000Z'),
        lte: new Date('2026-10-29T00:00:00.000Z'),
      },
    });
    expect(result?.bookings).toEqual([{ date: '2026-10-27', start: '18:00', end: '19:00' }]);
  });

  it('muestra un mentor en pausa sin permitir solicitudes', async () => {
    findFirst.mockResolvedValue(
      row({ disponibilidad_mentor_registros: [{ estado: 'EN_PAUSA', fecha_actualizacion: null }] }),
    );
    await expect(detail()).resolves.toMatchObject({
      availability: 'EN_PAUSA',
      canRequest: false,
      bookings: [],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('oculta el perfil de un mentor no disponible', async () => {
    findFirst.mockResolvedValue(
      row({ disponibilidad_mentor_registros: [{ estado: 'NO_DISPONIBLE', fecha_actualizacion: null }] }),
    );
    await expect(detail()).resolves.toBeNull();
  });
});

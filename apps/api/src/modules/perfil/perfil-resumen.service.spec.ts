import { NotFoundException } from '@nestjs/common';
import { PerfilResumenService, ResumenRepositorio } from './perfil-resumen.service';
import { PerfilCompleto } from './perfil.mappers';

const base = { idTitulado: 't1', fechaCreacion: '2026-10-01' };

const perfil: PerfilCompleto = {
  formacionAcademica: [
    { ...base, id: 'f1', titulo: 'Licenciatura', anioEgreso: 2018 },
    { ...base, id: 'f2', titulo: 'Maestría', anioEgreso: 2023 },
  ],
  experienciaLaboral: [
    { ...base, id: 'e1', cargo: 'Junior', fechaInicio: '2019-02-01' },
    { ...base, id: 'e2', cargo: 'Senior', fechaInicio: '2024-03-15' },
    { ...base, id: 'e3', cargo: 'Sin fecha', fechaInicio: null },
  ],
  certificaciones: [
    { ...base, id: 'c1', nombre: 'Scrum', anioEmision: 2021 },
    { ...base, id: 'c2', nombre: 'AWS', anioEmision: 2025 },
  ],
};

describe('PerfilResumenService', () => {
  it('ordena cada sección del más reciente al más antiguo y cuenta los registros', async () => {
    const repositorio: ResumenRepositorio = {
      obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
    };

    const resumen = await new PerfilResumenService(repositorio).obtenerResumen('t1');

    expect(repositorio.obtenerPerfilCompleto).toHaveBeenCalledWith('t1');
    expect(resumen.formacionAcademica.total).toBe(2);
    expect(resumen.formacionAcademica.registros.map((r) => r.id)).toEqual(['f2', 'f1']);
    expect(resumen.experienciaLaboral.total).toBe(3);
    expect(resumen.experienciaLaboral.registros.map((r) => r.id)).toEqual(['e2', 'e1', 'e3']);
    expect(resumen.certificaciones.registros.map((r) => r.id)).toEqual(['c2', 'c1']);
  });

  it('sin métodos de cabecera ni respaldos devuelve null en vez de inventar datos', async () => {
    const repositorio: ResumenRepositorio = {
      obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
    };

    const resumen = await new PerfilResumenService(repositorio).obtenerResumen('t1');

    expect(resumen.titulado).toEqual({ id: 't1', nombre: null, carrera: null, promocion: null });
    expect(resumen.certificaciones.registros[0].respaldo).toEqual({
      tieneRespaldo: null,
      tipo: null,
      fechaSubida: null,
    });
  });

  it('agrega los datos del titulado y el estado de respaldo de cada certificación', async () => {
    const repositorio: ResumenRepositorio = {
      obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
      obtenerDatosTitulado: jest
        .fn()
        .mockResolvedValue({ nombre: 'Ana Pérez', carrera: 'Ing. de Sistemas', promocion: 2020 }),
      listarRespaldos: jest.fn().mockResolvedValue([
        {
          id: 'r1',
          idCertificacion: 'c2',
          tipo: 'DOCUMENTO',
          archivoKey: 'c2/certificado.pdf',
          fechaSubida: '2026-10-02',
        },
      ]),
    };

    const resumen = await new PerfilResumenService(repositorio).obtenerResumen('t1');

    expect(resumen.titulado).toEqual({
      id: 't1',
      nombre: 'Ana Pérez',
      carrera: 'Ing. de Sistemas',
      promocion: 2020,
    });
    expect(repositorio.listarRespaldos).toHaveBeenCalledWith(['c2', 'c1']);
    const [aws, scrum] = resumen.certificaciones.registros;
    expect(aws.respaldo).toEqual({ tieneRespaldo: true, tipo: 'DOCUMENTO', fechaSubida: '2026-10-02' });
    expect(scrum.respaldo).toEqual({ tieneRespaldo: false, tipo: null, fechaSubida: null });
  });

  it('responde 404 si el titulado no existe', async () => {
    const repositorio: ResumenRepositorio = {
      obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
      obtenerDatosTitulado: jest.fn().mockResolvedValue(null),
    };

    await expect(new PerfilResumenService(repositorio).obtenerResumen('t1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

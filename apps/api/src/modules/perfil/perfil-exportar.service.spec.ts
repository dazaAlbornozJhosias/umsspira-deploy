import { NotFoundException } from '@nestjs/common';
import {
  PerfilExportarService,
  nombreArchivoExportacion,
  nombreParaArchivo,
} from './perfil-exportar.service';
import { ResumenRepositorio } from './perfil-resumen.service';
import { PerfilCompleto } from './perfil.mappers';

const base = { idTitulado: 't1', fechaCreacion: '2026-10-01' };
const ahora = new Date('2026-10-03T15:00:00Z');

const perfil: PerfilCompleto = {
  formacionAcademica: [{ ...base, id: 'f1', titulo: 'Licenciatura', anioEgreso: 2018 }],
  experienciaLaboral: [],
  certificaciones: [],
};

function repositorio(parcial: Partial<ResumenRepositorio> = {}): ResumenRepositorio {
  return {
    obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
    obtenerDatosTitulado: jest
      .fn()
      .mockResolvedValue({ nombre: 'Carlos Mendoza Ríos', carrera: 'Sistemas', promocion: 2018 }),
    ...parcial,
  };
}

describe('nombre del archivo (T5.3)', () => {
  it('usa minúsculas, guiones bajos y sin tildes', () => {
    expect(nombreParaArchivo('Carlos Mendoza Ríos')).toBe('carlos_mendoza_rios');
    expect(nombreArchivoExportacion('Carlos Mendoza Ríos', ahora)).toBe(
      'perfil_carlos_mendoza_rios_2026-10-03.json',
    );
  });

  it('sin nombre usa "titulado" en vez de dejar el hueco vacío', () => {
    expect(nombreParaArchivo(null)).toBe('titulado');
    expect(nombreParaArchivo('  ¿¿ ')).toBe('titulado');
  });
});

describe('PerfilExportarService', () => {
  it('reutiliza la consulta del perfil y devuelve JSON con 2 espacios de indentación', async () => {
    const repo = repositorio();

    const { contenido, nombreArchivo } = await new PerfilExportarService(repo).exportar('t1', ahora);

    expect(repo.obtenerPerfilCompleto).toHaveBeenCalledWith('t1');
    expect(nombreArchivo).toBe('perfil_carlos_mendoza_rios_2026-10-03.json');
    expect(contenido).toBe(JSON.stringify(JSON.parse(contenido), null, 2));
    expect(contenido).toContain('\n  "fechaExportacion": "2026-10-03"');

    const json = JSON.parse(contenido);
    expect(json.titulado).toMatchObject({ id: 't1', nombre: 'Carlos Mendoza Ríos' });
    expect(json.formacionAcademica.total).toBe(1);
    expect(json.formacionAcademica.registros[0].titulo).toBe('Licenciatura');
  });

  it('un perfil vacío igual se exporta, con las 3 secciones en cero', async () => {
    const vacio: PerfilCompleto = {
      formacionAcademica: [],
      experienciaLaboral: [],
      certificaciones: [],
    };
    const repo = repositorio({ obtenerPerfilCompleto: jest.fn().mockResolvedValue(vacio) });

    const json = JSON.parse((await new PerfilExportarService(repo).exportar('t1', ahora)).contenido);

    expect(json.formacionAcademica).toEqual({ total: 0, registros: [] });
    expect(json.experienciaLaboral).toEqual({ total: 0, registros: [] });
    expect(json.certificaciones).toEqual({ total: 0, registros: [] });
  });

  it('si el titulado no existe, propaga el 404 del resumen', async () => {
    const repo = repositorio({ obtenerDatosTitulado: jest.fn().mockResolvedValue(null) });

    await expect(new PerfilExportarService(repo).exportar('t1', ahora)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

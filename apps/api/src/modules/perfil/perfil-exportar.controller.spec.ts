import { ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { PerfilExportarController } from './perfil-exportar.controller';
import { PerfilRepository } from './perfil.repository';
import { PerfilCompleto } from './perfil.mappers';

// T5.4: pruebas del endpoint GET /api/v1/perfil/exportar-json
// (perfil con datos, perfil vacío y solicitud sin titulado autenticado)

const base = { idTitulado: 't1', fechaCreacion: '2026-10-01' };

const conDatos: PerfilCompleto = {
  formacionAcademica: [{ ...base, id: 'f1', titulo: 'Licenciatura', anioEgreso: 2018 }],
  experienciaLaboral: [],
  certificaciones: [],
};

const vacio: PerfilCompleto = {
  formacionAcademica: [],
  experienciaLaboral: [],
  certificaciones: [],
};

function crearControlador(perfil: PerfilCompleto) {
  const repositorio = {
    obtenerPerfilCompleto: jest.fn().mockResolvedValue(perfil),
    obtenerDatosTitulado: jest
      .fn()
      .mockResolvedValue({ nombre: 'Carlos Mendoza Ríos', carrera: 'Sistemas', promocion: 2018 }),
  };
  const controlador = new PerfilExportarController(repositorio as unknown as PerfilRepository);
  return { controlador, repositorio };
}

function crearRespuesta() {
  return { setHeader: jest.fn() } as unknown as Response & { setHeader: jest.Mock };
}

const peticion = {} as Request;

describe('GET /perfil/exportar-json (T5.4)', () => {
  const idOriginal = process.env.TITULADO_ID_PRUEBA;

  afterEach(() => {
    if (idOriginal === undefined) delete process.env.TITULADO_ID_PRUEBA;
    else process.env.TITULADO_ID_PRUEBA = idOriginal;
  });

  it('perfil con datos: devuelve el JSON y fuerza la descarga con el nombre del archivo', async () => {
    process.env.TITULADO_ID_PRUEBA = 't1';
    const { controlador, repositorio } = crearControlador(conDatos);
    const res = crearRespuesta();

    const contenido = await controlador.exportarJson(peticion, res);

    expect(repositorio.obtenerPerfilCompleto).toHaveBeenCalledWith('t1');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    const cabeceraDescarga = res.setHeader.mock.calls.find(([nombre]) => nombre === 'Content-Disposition');
    expect(cabeceraDescarga?.[1]).toMatch(/^attachment; filename="perfil_carlos_mendoza_rios_\d{4}-\d{2}-\d{2}\.json"$/);

    // indentación de 2 espacios
    expect(contenido).toBe(JSON.stringify(JSON.parse(contenido), null, 2));
    expect(JSON.parse(contenido).formacionAcademica.total).toBe(1);
  });

  it('perfil vacío: responde igual, con las 3 secciones en cero', async () => {
    process.env.TITULADO_ID_PRUEBA = 't1';
    const { controlador } = crearControlador(vacio);

    const json = JSON.parse(await controlador.exportarJson(peticion, crearRespuesta()));

    expect(json.formacionAcademica).toEqual({ total: 0, registros: [] });
    expect(json.experienciaLaboral).toEqual({ total: 0, registros: [] });
    expect(json.certificaciones).toEqual({ total: 0, registros: [] });
  });

  it('sin titulado autenticado: responde 403 y no consulta ni descarga nada', async () => {
    delete process.env.TITULADO_ID_PRUEBA;
    const { controlador, repositorio } = crearControlador(conDatos);
    const res = crearRespuesta();

    await expect(controlador.exportarJson(peticion, res)).rejects.toBeInstanceOf(ForbiddenException);

    expect(repositorio.obtenerPerfilCompleto).not.toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });
});

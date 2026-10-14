import { PerfilResumenService } from './perfil-resumen.service';
import { Registro } from './perfil.mappers';

// T3.2: el resumen debe cargar en < 2 s. Se verifica que haga un número fijo de consultas
// (una por sección + una para respaldos), sin importar cuántos registros tenga el titulado.
const certificacion = (id: string, anioEmision: number): Registro => ({
  id,
  idTitulado: 'titulado-1',
  fechaCreacion: null,
  anioEmision,
});

function crearRepositorio(certificaciones: Registro[]) {
  return {
    obtenerPerfilCompleto: jest.fn().mockResolvedValue({
      formacionAcademica: [],
      experienciaLaboral: [],
      certificaciones,
    }),
    obtenerDatosTitulado: jest.fn().mockResolvedValue({
      nombre: 'Titulado Prueba',
      carrera: 'Sistemas',
      promocion: 2020,
    }),
    listarRespaldos: jest.fn().mockResolvedValue([]),
  };
}

describe('PerfilResumenService · T3.2 rendimiento', () => {
  it('hace una sola consulta de respaldos para todas las certificaciones (sin N+1)', async () => {
    const repositorio = crearRepositorio([
      certificacion('c1', 2022),
      certificacion('c2', 2024),
      certificacion('c3', 2023),
    ]);
    const servicio = new PerfilResumenService(repositorio);

    await servicio.obtenerResumen('titulado-1');

    expect(repositorio.obtenerPerfilCompleto).toHaveBeenCalledTimes(1);
    expect(repositorio.obtenerDatosTitulado).toHaveBeenCalledTimes(1);
    expect(repositorio.listarRespaldos).toHaveBeenCalledTimes(1);
    expect(repositorio.listarRespaldos).toHaveBeenCalledWith(['c2', 'c3', 'c1']);
  });

  it('no consulta respaldos si el titulado no tiene certificaciones', async () => {
    const repositorio = crearRepositorio([]);
    const servicio = new PerfilResumenService(repositorio);

    await servicio.obtenerResumen('titulado-1');

    expect(repositorio.listarRespaldos).not.toHaveBeenCalled();
  });

  it('arma el resumen de un perfil grande en menos de 2 segundos', async () => {
    const muchas = Array.from({ length: 1000 }, (_, i) => certificacion(`c${i}`, 2000 + (i % 25)));
    const repositorio = crearRepositorio(muchas);
    const servicio = new PerfilResumenService(repositorio);

    const inicio = Date.now();
    const resumen = await servicio.obtenerResumen('titulado-1');
    const duracion = Date.now() - inicio;

    expect(resumen.certificaciones.total).toBe(1000);
    expect(repositorio.listarRespaldos).toHaveBeenCalledTimes(1);
    expect(duracion).toBeLessThan(2000);
  });
});

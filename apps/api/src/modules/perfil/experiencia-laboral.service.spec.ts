import { ExperienciaLaboralService } from './experiencia-laboral.service';
import { PerfilRepository } from './perfil.repository';

describe('ExperienciaLaboralService', () => {
  const insertar = jest.fn();
  const servicio = new ExperienciaLaboralService({ insertar } as unknown as PerfilRepository);

  beforeEach(() => insertar.mockReset());

  it('guarda la experiencia con su fecha de fin', async () => {
    insertar.mockResolvedValue({ id: 'e1' });
    const datos = { empresa: 'ACME', cargo: 'Dev', fechaInicio: '2024-01-10', fechaFin: '2025-02-01' };

    await expect(servicio.crear('t1', datos)).resolves.toEqual({ id: 'e1' });
    expect(insertar).toHaveBeenCalledWith('experiencia-laboral', 't1', datos);
  });

  it('guarda fecha de fin vacía cuando es el trabajo actual', async () => {
    insertar.mockResolvedValue({ id: 'e2' });

    await servicio.crear('t1', { empresa: 'ACME', cargo: 'Dev', fechaInicio: '2024-01-10' });
    expect(insertar).toHaveBeenCalledWith('experiencia-laboral', 't1', {
      empresa: 'ACME',
      cargo: 'Dev',
      fechaInicio: '2024-01-10',
      fechaFin: null,
    });
  });
});
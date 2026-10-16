import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearExperienciaLaboralDto } from '../dto/crear-experiencia-laboral.dto';

async function errores(datos: object): Promise<string[]> {
  const dto = plainToInstance(CrearExperienciaLaboralDto, datos);
  const resultado = await validate(dto);
  return resultado.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('Fecha mínima de experiencia laboral (BUG-HU2-008)', () => {
  const base = { empresa: 'Jalasoft', cargo: 'Desarrollador Backend' };

  it('rechaza fechas anteriores a 1950', async () => {
    const mensajes = await errores({ ...base, fechaInicio: '1780-12-21', fechaFin: '1789-11-21' });

    expect(mensajes).toContain('La fecha de inicio no puede ser anterior a 1950');
    expect(mensajes).toContain('La fecha de fin no puede ser anterior a 1950');
  });

  it('acepta fechas desde el 01/01/1950', async () => {
    expect(await errores({ ...base, fechaInicio: '1950-01-01', fechaFin: '2023-06-30' })).toEqual([]);
  });
});

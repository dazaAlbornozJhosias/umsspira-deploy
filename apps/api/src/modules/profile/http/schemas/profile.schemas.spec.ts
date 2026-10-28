import {
  createCertificationSchema,
  experienceSchema,
  professionalDescriptionSchema,
} from './profile.schemas';

const base = { empresa: 'Jalasoft', cargo: 'Desarrollador Backend' };

function messages(data: object): string[] {
  const result = experienceSchema.safeParse({ ...base, ...data });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('Fecha mínima de experiencia laboral (BUG-HU2-008)', () => {
  it('rechaza fechas de inicio y fin anteriores a 1950', () => {
    expect(messages({ fechaInicio: '1780-12-21', fechaFin: '1789-11-21' })).toEqual([
      'La fecha no puede ser anterior a 1950',
      'La fecha no puede ser anterior a 1950',
    ]);
  });

  it('acepta fechas desde el 01/01/1950', () => {
    expect(messages({ fechaInicio: '1950-01-01', fechaFin: '2023-06-30' })).toEqual([]);
  });

  it('acepta un trabajo actual sin fecha de fin', () => {
    expect(messages({ fechaInicio: '2020-03-01', fechaFin: null })).toEqual([]);
  });
});

describe('Grado por defecto al crear una certificación (T8.7)', () => {
  const datos = {
    nombre: 'AWS Solutions Architect',
    entidadEmisora: 'Amazon Web Services',
    anioEmision: 2022,
  };

  it('usa Profesional si no llega el grado', () => {
    expect(createCertificationSchema.parse(datos).grado).toBe('Profesional');
  });

  it('conserva el grado cuando se envía', () => {
    expect(createCertificationSchema.parse({ ...datos, grado: 'Asociado' }).grado).toBe('Asociado');
  });

  it('rechaza un grado vacío', () => {
    expect(createCertificationSchema.safeParse({ ...datos, grado: '' }).success).toBe(false);
  });
});

describe('Descripción profesional (T6.4)', () => {
  it('recorta espacios y acepta hasta 5000 caracteres', () => {
    expect(professionalDescriptionSchema.parse({ descripcionProfesional: '  Hola  ' })).toEqual({
      descripcionProfesional: 'Hola',
    });
    expect(
      professionalDescriptionSchema.safeParse({ descripcionProfesional: 'a'.repeat(5000) }).success,
    ).toBe(true);
  });

  it('rechaza más de 5000 caracteres con un mensaje claro', () => {
    const result = professionalDescriptionSchema.safeParse({
      descripcionProfesional: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('La descripción no puede superar 5000 caracteres');
  });

  it('acepta vacía para borrar la descripción y rechaza campos de más', () => {
    expect(professionalDescriptionSchema.safeParse({ descripcionProfesional: '' }).success).toBe(
      true,
    );
    expect(
      professionalDescriptionSchema.safeParse({ descripcionProfesional: 'x', idTitulado: 't2' })
        .success,
    ).toBe(false);
  });
});

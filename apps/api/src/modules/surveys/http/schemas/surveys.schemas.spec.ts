import { submitSurveySchema } from './surveys.schemas';

const respuestaCompleta = {
  condicion_laboral: true,
  cargo: 'Analista de sistemas',
  empresa: 'Jalasoft',
  area: 'Desarrollo de software',
  modalidad: 'Remoto',
  salario_mensual: '5.001–8.000',
  tiempo_insercion: '6',
};

describe('submitSurveySchema · límite de caracteres (CA de la HU-2)', () => {
  it.each(['cargo', 'empresa', 'area'] as const)('acepta %s con 100 caracteres', (campo) => {
    const result = submitSurveySchema.safeParse({ ...respuestaCompleta, [campo]: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it.each(['cargo', 'empresa', 'area'] as const)('rechaza %s con 101 caracteres', (campo) => {
    const result = submitSurveySchema.safeParse({ ...respuestaCompleta, [campo]: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

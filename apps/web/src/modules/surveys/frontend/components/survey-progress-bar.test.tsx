import { render, screen } from '@testing-library/react';

import { SurveyProgressBar, calculateSurveyProgress, type SurveyProgressValues } from './survey-progress-bar';

const VACIO: SurveyProgressValues = {
  condicion_laboral: true,
  cargo: '',
  empresa: '',
  area: '',
  modalidad: '',
  salario_mensual: '',
  tiempo_insercion: '',
};

const COMPLETO: SurveyProgressValues = {
  condicion_laboral: true,
  cargo: 'Analista de sistemas',
  empresa: 'Tecnología Andina S.R.L.',
  area: 'Desarrollo de software',
  modalidad: 'Híbrido',
  salario_mensual: '5.001–8.000',
  tiempo_insercion: '6',
};

describe('calculateSurveyProgress', () => {
  it('empieza en 0 % con el formulario vacío', () => {
    expect(calculateSurveyProgress(VACIO)).toBe(0);
  });

  it('da 50 % con 3 de 6 preguntas respondidas (mock-up HU2-D-02)', () => {
    expect(
      calculateSurveyProgress({ ...VACIO, cargo: 'Analista', empresa: 'Empresa', modalidad: 'Híbrido' }),
    ).toBe(50);
  });

  it('redondea a entero: 1 de 6 es 17 %', () => {
    expect(calculateSurveyProgress({ ...VACIO, cargo: 'Analista' })).toBe(17);
  });

  it('llega a 100 % con todo respondido', () => {
    expect(calculateSurveyProgress(COMPLETO)).toBe(100);
  });

  it('con «No trabaja» muestra 100 % porque no quedan preguntas visibles', () => {
    expect(calculateSurveyProgress({ ...VACIO, condicion_laboral: false })).toBe(100);
  });

  it('sin condición laboral elegida queda en 0 %', () => {
    expect(calculateSurveyProgress({ ...COMPLETO, condicion_laboral: null })).toBe(0);
  });

  it('un campo con solo espacios no cuenta como respondido', () => {
    expect(calculateSurveyProgress({ ...VACIO, cargo: '   ' })).toBe(0);
  });

  it('0 meses de inserción sí cuenta como respondido', () => {
    expect(calculateSurveyProgress({ ...VACIO, tiempo_insercion: '0' })).toBe(17);
  });

  it('baja al borrar una respuesta', () => {
    expect(calculateSurveyProgress({ ...COMPLETO, empresa: '' })).toBe(83);
  });
});

describe('SurveyProgressBar', () => {
  it('muestra «0 % completado» y la leyenda', () => {
    render(<SurveyProgressBar values={VACIO} />);
    expect(screen.getByText('0 % completado')).toBeTruthy();
    expect(screen.getByText('El progreso considera solo las preguntas visibles y completas.')).toBeTruthy();
  });

  it('expone el porcentaje en la barra para lectores de pantalla', () => {
    render(<SurveyProgressBar values={{ ...VACIO, cargo: 'A', empresa: 'B', modalidad: 'Remoto' }} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
    expect(screen.getByText('50 % completado')).toBeTruthy();
  });

  it('se actualiza al cambiar las respuestas, sin recargar', () => {
    const { rerender } = render(<SurveyProgressBar values={VACIO} />);
    rerender(<SurveyProgressBar values={COMPLETO} />);
    expect(screen.getByText('100 % completado')).toBeTruthy();
  });

  it('a 100 % se muestra en verde', () => {
    render(<SurveyProgressBar values={COMPLETO} />);
    expect(screen.getByText('100 % completado').className).toContain('text-green-700');
  });
});

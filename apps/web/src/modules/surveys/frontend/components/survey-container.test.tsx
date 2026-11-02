import { fireEvent, render, screen } from '@testing-library/react';

import { SurveyContainer } from './survey-container';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('../hooks/use-survey-user-id', () => ({
  useSurveyUserId: () => 'user-1',
}));

jest.mock('../hooks/use-survey-submit', () => ({
  useSurveySubmit: () => ({
    isSubmitting: false,
    status: 'idle',
    message: null,
    submit: jest.fn(),
    resetFeedback: jest.fn(),
  }),
}));

const DRAFT_KEY = 'umsspira:survey-draft:user-1';

const elegirTrabaja = () => fireEvent.click(screen.getByRole('radio', { name: /^Trabaja/ }));
const elegirNoTrabaja = () => fireEvent.click(screen.getByRole('radio', { name: /^No trabaja/ }));
const escribir = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
const siguiente = () => fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
const valorDe = (placeholder: string) => (screen.getByPlaceholderText(placeholder) as HTMLInputElement).value;

function llenarFormulario() {
  elegirTrabaja();
  escribir('Ej. Analista de sistemas', 'Analista');
  escribir('Ej. Nombre de la empresa', 'Acme');
  escribir('Ej. Desarrollo de software', 'Sistemas');
  fireEvent.click(screen.getByRole('radio', { name: 'Remoto' }));
  fireEvent.click(screen.getByRole('radio', { name: '3.000–5.000' }));
  escribir('Ej. 6', '6');
}

const SESSION_KEY = 'umsspira:survey-session:user-1';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('SurveyContainer · formulario HU-2', () => {
  it('no deja avanzar sin elegir la condición laboral', () => {
    render(<SurveyContainer />);
    siguiente();
    expect(screen.getByRole('alert').textContent).toBe('Seleccione su condición laboral actual');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('con Trabaja no muestra errores hasta que el titulado intenta continuar', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    expect(screen.queryAllByText('Este campo es obligatorio')).toHaveLength(0);
  });

  it('al presionar Siguiente con Trabaja muestra «Este campo es obligatorio» en cada pregunta vacía', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    siguiente();
    expect(screen.getAllByText('Este campo es obligatorio')).toHaveLength(6);
  });

  it('al pasar de Trabaja a No trabaja avisa que se descartaron las respuestas', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    escribir('Ej. Analista de sistemas', 'Analista');
    elegirNoTrabaja();
    expect(screen.getByText('Las respuestas anteriores se descartaron')).toBeTruthy();
    expect(
      screen.getByText('No se enviarán datos de cargo, empresa, salario o inserción que ahora están ocultos'),
    ).toBeTruthy();
  });

  it('no muestra el aviso de descarte al elegir No trabaja desde el inicio', () => {
    render(<SurveyContainer />);
    elegirNoTrabaja();
    expect(screen.queryByText('Las respuestas anteriores se descartaron')).toBeNull();
  });

  it('al volver a Trabaja oculta el aviso y los campos aparecen vacíos', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    escribir('Ej. Analista de sistemas', 'Analista');
    elegirNoTrabaja();
    elegirTrabaja();
    expect(screen.queryByText('Las respuestas anteriores se descartaron')).toBeNull();
    expect(valorDe('Ej. Analista de sistemas')).toBe('');
  });

  it('con campos obligatorios vacíos no abre el resumen', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    siguiente();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('con No trabaja oculta los campos laborales y deja avanzar', () => {
    render(<SurveyContainer />);
    elegirNoTrabaja();
    expect(screen.queryByPlaceholderText('Ej. Analista de sistemas')).toBeNull();
    siguiente();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('con Trabaja y todo respondido abre el resumen', () => {
    render(<SurveyContainer />);
    llenarFormulario();
    siguiente();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('solo una modalidad queda marcada al cambiar de opción', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    fireEvent.click(screen.getByRole('radio', { name: 'Remoto' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Híbrido' }));
    const marcadas = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true');
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0].textContent).toBe('Híbrido');
  });

  it('al volver desde el resumen conserva todo lo escrito', () => {
    render(<SurveyContainer />);
    llenarFormulario();
    siguiente();
    fireEvent.click(screen.getByRole('button', { name: /Volver y editar/ }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(valorDe('Ej. Analista de sistemas')).toBe('Analista');
    expect(valorDe('Ej. Nombre de la empresa')).toBe('Acme');
    expect(valorDe('Ej. Desarrollo de software')).toBe('Sistemas');
    expect(valorDe('Ej. 6')).toBe('6');
    expect(screen.getByRole('radio', { name: 'Remoto' }).getAttribute('aria-checked')).toBe('true');
    expect((screen.getByRole('radio', { name: '3.000–5.000' }) as HTMLInputElement).checked).toBe(true);
  });

  it('guarda el borrador al pasar al resumen, sin salario ni tiempo de inserción', () => {
    render(<SurveyContainer />);
    llenarFormulario();
    siguiente();
    const guardado = JSON.parse(window.localStorage.getItem(DRAFT_KEY) as string);
    expect(guardado).toEqual({
      workCondition: 'works',
      cargo: 'Analista',
      empresa: 'Acme',
      area: 'Sistemas',
      modalidad: 'remoto',
    });
  });

  it('recupera el borrador al volver a abrir la encuesta', async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        workCondition: 'works',
        cargo: 'Analista',
        empresa: 'Acme',
        area: 'Sistemas',
        modalidad: 'remoto',
      }),
    );
    render(<SurveyContainer />);
    await screen.findByDisplayValue('Analista');
    expect(valorDe('Ej. Nombre de la empresa')).toBe('Acme');
    expect(valorDe('Ej. Desarrollo de software')).toBe('Sistemas');
    expect(valorDe('Ej. 6')).toBe('');
    expect(screen.getByText('Borrador recuperado')).toBeTruthy();
  });

  it('guarda el borrador mientras escribe, sin presionar Siguiente', () => {
    render(<SurveyContainer />);
    elegirTrabaja();
    escribir('Ej. Analista de sistemas', 'Analista');
    const guardado = JSON.parse(window.localStorage.getItem(DRAFT_KEY) as string);
    expect(guardado).toEqual({ workCondition: 'works', cargo: 'Analista' });
  });

  it('guarda salario y tiempo solo en la sesión de la pestaña, no en localStorage', () => {
    render(<SurveyContainer />);
    llenarFormulario();
    expect(window.localStorage.getItem(DRAFT_KEY)).not.toContain('3.000');
    expect(JSON.parse(window.sessionStorage.getItem(SESSION_KEY) as string)).toEqual({
      salario_mensual: '3.000–5.000',
      tiempo_insercion: '6',
    });
  });

  it('al volver a la encuesta en la misma pestaña recupera también salario y tiempo', async () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ workCondition: 'works', cargo: 'Analista' }));
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ salario_mensual: '3.000–5.000', tiempo_insercion: '6' }));
    render(<SurveyContainer />);
    await screen.findByDisplayValue('Analista');
    expect(valorDe('Ej. 6')).toBe('6');
    expect((screen.getByRole('radio', { name: '3.000–5.000' }) as HTMLInputElement).checked).toBe(true);
  });

  it('al pasar a No trabaja borra salario y tiempo de la sesión', () => {
    render(<SurveyContainer />);
    llenarFormulario();
    elegirNoTrabaja();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) as string)).toEqual({ workCondition: 'not-works' });
  });

  it('tras recuperar el borrador la modalidad sigue marcada', async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ workCondition: 'works', cargo: 'Analista', modalidad: 'remoto' }),
    );
    render(<SurveyContainer />);
    await screen.findByDisplayValue('Analista');
    expect(screen.getByRole('radio', { name: 'Remoto' }).getAttribute('aria-checked')).toBe('true');
  });
});
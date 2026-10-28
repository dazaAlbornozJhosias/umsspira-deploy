import { act, fireEvent, render, screen } from '@testing-library/react';
import { MentorDetailPage } from './mentor-detail-page';
import { getMentorDetail, MentorNotFoundError } from '../../services/mentor-detail-api';
import { SessionError } from '@/shared/services/auth-session';
import type { MentorDetailProfile } from '../../model/mentor-detail';

jest.mock('../../services/mentor-detail-api');
const mockGetMentorDetail = jest.mocked(getMentorDetail);

const sampleMentorAvailable: MentorDetailProfile = {
  id: 'carlos-vargas',
  fullName: 'Carlos Vargas',
  photoUrl: null,
  jobTitle: 'Arquitecto de Software',
  company: 'Jalasoft',
  about: 'Ingeniero de Sistemas (UMSS, 2011). Más de 12 años construyendo productos de software.',
  experience: 'Arquitecto de Software en Jalasoft desde 2018.',
  relevantInfo: 'Disponible por las tardes para revisar arquitectura de proyectos de grado.',
  technicalAreas: ['Desarrollo de Software', 'DevOps'],
  interests: [
    {
      area: 'Desarrollo de Software',
      items: ['Arquitectura de software', 'Patrones de diseño'],
    },
    {
      area: 'DevOps',
      items: ['CI/CD'],
    },
  ],
  availability: 'AVAILABLE',
  weekLabel: 'Del 19 al 25 oct · sesiones de 1 hora',
  slots: [
    {
      date: '2026-10-19',
      dayLabel: 'lunes 19 oct',
      times: ['09:00', '11:00'],
    },
    {
      date: '2026-10-20',
      dayLabel: 'martes 20 oct',
      times: ['10:00', '16:00'],
    },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('MentorDetailPage', () => {
  it('muestra skeletons de carga con rol accesible y luego renderiza el perfil disponible', async () => {
    const pending = deferred<MentorDetailProfile>();
    mockGetMentorDetail.mockReturnValue(pending.promise);

    render(<MentorDetailPage mentorId="carlos-vargas" />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando perfil del mentor...');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Perfil del mentor' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al directorio/i })).toHaveAttribute(
      'href',
      '/mentorship/directory',
    );

    await act(async () => {
      pending.resolve(sampleMentorAvailable);
    });

    expect(await screen.findByRole('heading', { level: 2, name: 'Carlos Vargas' })).toBeInTheDocument();
    expect(screen.getByText('Arquitecto de Software | Jalasoft')).toBeInTheDocument();

    // Badge y botón
    expect(screen.getAllByText('Disponible')).toHaveLength(2);
    const requestBtn = screen.getByRole('button', { name: /Solicitar mentoría/i });
    expect(requestBtn).toBeEnabled();

    // Tarjetas izquierda
    expect(screen.getByText(sampleMentorAvailable.about!)).toBeInTheDocument();
    expect(screen.getByText(sampleMentorAvailable.experience!)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Información relevante' })).toBeInTheDocument();
    expect(screen.getByText(sampleMentorAvailable.relevantInfo!)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText('Desarrollo de Software')).toHaveLength(2);
    expect(screen.getAllByText('DevOps')).toHaveLength(2);
    expect(screen.getByText('Arquitectura de software')).toBeInTheDocument();
    expect(screen.getByText('CI/CD')).toBeInTheDocument();

    // Tarjeta disponibilidad (derecha)
    expect(screen.getByText('Horarios disponibles')).toBeInTheDocument();
    expect(screen.getByText('Del 19 al 25 oct · sesiones de 1 hora')).toBeInTheDocument();
    expect(screen.getByText('lunes 19 oct')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('Elegirás fecha y horario al solicitar la mentoría.')).toBeInTheDocument();

    // Título del documento
    expect(document.title).toBe('Perfil del mentor: Carlos Vargas | UMSSPIRA');
  });

  it('renderiza avatar con 2 iniciales limpias sin encimar texto (ej. "RS" para Rodrigo Salazar)', async () => {
    mockGetMentorDetail.mockResolvedValueOnce({
      ...sampleMentorAvailable,
      id: 'rodrigo',
      fullName: 'Rodrigo Salazar Torrico',
      availability: 'PAUSED',
    });

    render(<MentorDetailPage mentorId="rodrigo" />);

    const avatar = await screen.findByRole('img', { name: 'Foto de Rodrigo Salazar Torrico no disponible' });
    expect(avatar).toHaveTextContent('RS');
    expect(avatar).not.toHaveTextContent('Rod');
  });

  it('gestiona perfil pausado y no disponible con botón deshabilitado y mensaje de bloqueo', async () => {
    mockGetMentorDetail.mockResolvedValueOnce({
      ...sampleMentorAvailable,
      id: 'luis-fernandez',
      fullName: 'Luis Fernández Rojas',
      availability: 'UNAVAILABLE',
      slots: [],
    });

    render(<MentorDetailPage mentorId="luis-fernandez" />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Luis Fernández Rojas' })).toBeInTheDocument();
    // En cabecera y en tarjeta de disponibilidad
    expect(screen.getAllByText('No disponible')).toHaveLength(2);

    // Botón solicitar mentoría deshabilitado
    const requestBtn = screen.getByRole('button', { name: /Solicitar mentoría/i });
    expect(requestBtn).toBeDisabled();

    // Aviso de recepción cerrada
    expect(
      screen.getByText('Este mentor no está recibiendo nuevas solicitudes en este momento.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Puedes revisar su perfil o volver al directorio para encontrar otros mentores disponibles.'),
    ).toBeInTheDocument();

    // Disponibilidad bloqueada
    expect(
      screen.getByText('No hay horarios seleccionables mientras el mentor no reciba solicitudes.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Horarios disponibles')).not.toBeInTheDocument();
  });

  it('muestra mensajes amigables cuando el perfil no tiene información registrada', async () => {
    mockGetMentorDetail.mockResolvedValueOnce({
      ...sampleMentorAvailable,
      fullName: 'Gabriela Terrazas',
      about: null,
      experience: null,
      relevantInfo: null,
      technicalAreas: [],
      interests: [],
    });

    render(<MentorDetailPage mentorId="gabriela-terrazas" />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Gabriela Terrazas' })).toBeInTheDocument();

    const emptyTexts = screen.getAllByText('El mentor todavía no agregó esta información.');
    expect(emptyTexts).toHaveLength(3); // Sobre el mentor + Experiencia + Información relevante

    expect(screen.getByText('Sin áreas técnicas registradas')).toBeInTheDocument();
    expect(screen.getByText('Sin temas de interés registrados')).toBeInTheDocument();
  });

  it('trata la disponibilidad sin configurar como no disponible para solicitar', async () => {
    mockGetMentorDetail.mockResolvedValueOnce({ ...sampleMentorAvailable, availability: null, slots: [] });

    render(<MentorDetailPage mentorId="carlos-vargas" />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Carlos Vargas' })).toBeInTheDocument();
    expect(screen.getAllByText('Disponibilidad sin configurar')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Solicitar mentoría/i })).toBeDisabled();
    expect(screen.queryByText('Horarios disponibles')).not.toBeInTheDocument();
  });

  it('renderiza la pantalla de perfil no disponible/inexistente sin breadcrumb ni título (Mockup 5)', async () => {
    mockGetMentorDetail.mockRejectedValueOnce(new MentorNotFoundError());

    render(<MentorDetailPage mentorId="inexistente" />);

    expect(await screen.findByText('Este perfil ya no está disponible')).toBeInTheDocument();
    expect(
      screen.getByText(
        'El mentor dejó de cumplir las condiciones para aparecer en el directorio o su perfil ya no existe.',
      ),
    ).toBeInTheDocument();

    // Según Mockup 5: sin breadcrumb ni título "Perfil del mentor", solo pestañas y tarjeta centrada
    expect(screen.queryByLabelText('Ruta de navegación')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Perfil del mentor' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación de mentorías' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al directorio/i })).toHaveAttribute(
      'href',
      '/mentorship/directory',
    );
    expect(document.title).toBe('Perfil no disponible | UMSSPIRA');
  });

  it('reintenta la consulta cuando ocurre un error 5xx sin recargar la página', async () => {
    mockGetMentorDetail.mockRejectedValueOnce(new Error('Fallo del servidor'));

    render(<MentorDetailPage mentorId="carlos-vargas" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el perfil del mentor');
    expect(
      screen.getByText(
        'Ocurrió un problema al consultar el perfil del mentor. Revisa tu conexión e inténtalo nuevamente.',
      ),
    ).toBeInTheDocument();

    mockGetMentorDetail.mockResolvedValueOnce(sampleMentorAvailable);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Carlos Vargas' })).toBeInTheDocument();
    expect(mockGetMentorDetail).toHaveBeenCalledTimes(2);
  });

  it('muestra estado de sesión vencida (401) con botón a /login', async () => {
    mockGetMentorDetail.mockRejectedValueOnce(
      new SessionError(401, 'Inicia sesión nuevamente para consultar el perfil del mentor.'),
    );

    render(<MentorDetailPage mentorId="carlos-vargas" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Inicia sesión nuevamente para consultar el perfil del mentor.',
    );
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  });

  it('NO renderiza datos privados ni controles de edición', async () => {
    mockGetMentorDetail.mockResolvedValueOnce({
      ...sampleMentorAvailable,
      // @ts-expect-error simulación de campos privados si llegaran
      email: 'privado@ejemplo.com',
      telefono: '77712345',
      ci: '1234567',
    });

    render(<MentorDetailPage mentorId="carlos-vargas" />);

    await screen.findByRole('heading', { level: 2, name: 'Carlos Vargas' });

    // Verificación de datos privados
    expect(screen.queryByText('privado@ejemplo.com')).not.toBeInTheDocument();
    expect(screen.queryByText('77712345')).not.toBeInTheDocument();
    expect(screen.queryByText('1234567')).not.toBeInTheDocument();

    // Verificación de que no existen controles de edición
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });
});

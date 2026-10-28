import { fireEvent, render, screen } from '@testing-library/react';
import { MentorDirectoryFilters } from './mentor-directory-filters';
import type { InterestArea } from '../../model/mentor-interests';

const TEST_CATALOG: InterestArea[] = [
  {
    id: 'software',
    name: 'Desarrollo de Software',
    description: 'Frontend, backend y desarrollo de software.',
    topics: [
      { id: 'api', name: 'APIs REST' },
      { id: 'web', name: 'Desarrollo web' },
      { id: 'clean-code', name: 'Clean Code y patrones' },
      { id: 'testing', name: 'Pruebas automatizadas' },
    ],
  },
  {
    id: 'data',
    name: 'Bases de Datos',
    description: 'Diseño, modelado y optimización de bases de datos.',
    topics: [
      { id: 'sql', name: 'PostgreSQL y SQL' },
      { id: 'data-modeling', name: 'Modelado de datos' },
      { id: 'query-opt', name: 'Optimización de consultas' },
      { id: 'nosql', name: 'NoSQL' },
    ],
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'CI/CD, contenedores e infraestructura en la nube.',
    topics: [
      { id: 'docker', name: 'Docker y Contenedores' },
      { id: 'cicd', name: 'CI/CD Pipelines' },
      { id: 'cloud', name: 'Cloud Computing' },
      { id: 'infra', name: 'Infraestructura' },
    ],
  },
  {
    id: 'security',
    name: 'Ciberseguridad',
    description: 'Seguridad en aplicaciones y redes.',
    topics: [
      { id: 'sec-web', name: 'Seguridad web (OWASP)' },
      { id: 'sec-auth', name: 'Autenticación y Autorización' },
      { id: 'crypto', name: 'Criptografía' },
      { id: 'sec-audit', name: 'Auditoría de seguridad' },
    ],
  },
  {
    id: 'mobile',
    name: 'Desarrollo móvil',
    description: 'Aplicaciones nativas e híbridas para Android e iOS.',
    topics: [
      { id: 'react-native', name: 'React Native' },
      { id: 'flutter', name: 'Flutter' },
      { id: 'android', name: 'Android (Kotlin)' },
      { id: 'ios', name: 'iOS (Swift)' },
    ],
  },
  {
    id: 'architecture',
    name: 'Arquitectura y diseño de software',
    description: 'Patrones arquitectónicos y diseño de sistemas.',
    topics: [
      { id: 'microservices', name: 'Microservicios' },
      { id: 'patterns', name: 'Patrones de arquitectura' },
      { id: 'system-design', name: 'Diseño de sistemas escalables' },
      { id: 'ddd', name: 'Domain-Driven Design (DDD)' },
    ],
  },
];

describe('MentorDirectoryFilters - Tareas 101, 102 y 103', () => {
  const onApplyMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('Tarea 101: Selección de áreas técnicas (CA-01, CA-02)', () => {
    it('CA-01: lista todas las áreas técnicas activas del catálogo recibido por el backend', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />
      );

      const expectedAreas = [
        'Desarrollo de Software',
        'Bases de Datos',
        'DevOps',
        'Ciberseguridad',
        'Desarrollo móvil',
        'Arquitectura y diseño de software',
      ];

      for (const areaName of expectedAreas) {
        const checkbox = screen.getByRole('checkbox', { name: areaName });
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
      }
    });

    it('CA-02: permite seleccionar un área técnica y refleja su estado visual de inmediato', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const devopsCheckbox = screen.getByRole('checkbox', { name: 'DevOps' });
      const devopsLabel = devopsCheckbox.closest('label');

      expect(devopsCheckbox).not.toBeChecked();
      expect(devopsLabel).not.toHaveClass('is-selected');

      fireEvent.click(devopsCheckbox);

      expect(devopsCheckbox).toBeChecked();
      expect(devopsLabel).toHaveClass('is-selected');
    });

    it('CA-02: permite seleccionar múltiples áreas técnicas simultáneamente', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const softwareCheckbox = screen.getByRole('checkbox', { name: 'Desarrollo de Software' });
      const securityCheckbox = screen.getByRole('checkbox', { name: 'Ciberseguridad' });
      const mobileCheckbox = screen.getByRole('checkbox', { name: 'Desarrollo móvil' });

      fireEvent.click(softwareCheckbox);
      fireEvent.click(securityCheckbox);
      fireEvent.click(mobileCheckbox);

      expect(softwareCheckbox).toBeChecked();
      expect(softwareCheckbox.closest('label')).toHaveClass('is-selected');

      expect(securityCheckbox).toBeChecked();
      expect(securityCheckbox.closest('label')).toHaveClass('is-selected');

      expect(mobileCheckbox).toBeChecked();
      expect(mobileCheckbox.closest('label')).toHaveClass('is-selected');

      const dataCheckbox = screen.getByRole('checkbox', { name: 'Bases de Datos' });
      expect(dataCheckbox).not.toBeChecked();
      expect(dataCheckbox.closest('label')).not.toHaveClass('is-selected');
    });

    it('permite deseleccionar un área previamente seleccionada', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['devops', 'software'], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const devopsCheckbox = screen.getByRole('checkbox', { name: 'DevOps' });
      const devopsLabel = devopsCheckbox.closest('label');
      expect(devopsCheckbox).toBeChecked();
      expect(devopsLabel).toHaveClass('is-selected');

      fireEvent.click(devopsCheckbox);

      expect(devopsCheckbox).not.toBeChecked();
      expect(devopsLabel).not.toHaveClass('is-selected');

      const softwareCheckbox = screen.getByRole('checkbox', { name: 'Desarrollo de Software' });
      expect(softwareCheckbox).toBeChecked();
    });
  });

  describe('Tarea 102: Mostrar intereses correspondientes a las áreas técnicas seleccionadas (CA-03, CA-04, CA-05)', () => {
    it('CA-04: muestra mensaje contextual indicando seleccionar al menos un área cuando no hay áreas seleccionadas', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      expect(
        screen.getByText('Selecciona al menos un área técnica para ver sus intereses correspondientes.'),
      ).toBeInTheDocument();
    });

    it('CA-03: al seleccionar un área, muestra únicamente los intereses correspondientes a esa área', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      // Al inicio sin áreas seleccionadas
      expect(screen.queryByText('Intereses correspondientes a las áreas seleccionadas.')).not.toBeInTheDocument();

      // Seleccionar DevOps
      const devopsCheckbox = screen.getByRole('checkbox', { name: 'DevOps' });
      fireEvent.click(devopsCheckbox);

      // Mensaje contextual cambia para confirmar que muestra intereses correspondientes
      expect(screen.getByText('Intereses correspondientes a las áreas seleccionadas.')).toBeInTheDocument();

      // Muestra intereses de DevOps
      expect(screen.getByRole('checkbox', { name: 'Docker y Contenedores' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'CI/CD Pipelines' })).toBeInTheDocument();

      // NO debe mostrar intereses de otras áreas (ej. PostgreSQL de Bases de Datos o Flutter de Desarrollo móvil)
      expect(screen.queryByRole('checkbox', { name: 'PostgreSQL y SQL' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Flutter' })).not.toBeInTheDocument();
    });

    it('CA-03: al seleccionar múltiples áreas, muestra los grupos de intereses de todas las áreas seleccionadas', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      // Seleccionar DevOps y Desarrollo móvil
      fireEvent.click(screen.getByRole('checkbox', { name: 'DevOps' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Desarrollo móvil' }));

      // Se muestran los intereses de DevOps
      expect(screen.getByRole('checkbox', { name: 'Docker y Contenedores' })).toBeInTheDocument();

      // Se muestran los intereses de Desarrollo móvil
      expect(screen.getByRole('checkbox', { name: 'Flutter' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'React Native' })).toBeInTheDocument();

      // NO se muestran los de Ciberseguridad ni Bases de Datos
      expect(screen.queryByRole('checkbox', { name: 'Criptografía' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'PostgreSQL y SQL' })).not.toBeInTheDocument();
    });

    it('CA-05: si se deselecciona un área técnica, sus intereses asociados seleccionados se desmarcan y desaparecen de las opciones', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: [], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      // Seleccionar DevOps y Ciberseguridad
      fireEvent.click(screen.getByRole('checkbox', { name: 'DevOps' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Ciberseguridad' }));

      // Seleccionar un tópico de cada una
      const dockerTopic = screen.getByRole('checkbox', { name: 'Docker y Contenedores' });
      const cryptoTopic = screen.getByRole('checkbox', { name: 'Criptografía' });
      fireEvent.click(dockerTopic);
      fireEvent.click(cryptoTopic);

      expect(dockerTopic).toBeChecked();
      expect(cryptoTopic).toBeChecked();

      // Deseleccionar DevOps
      fireEvent.click(screen.getByRole('checkbox', { name: 'DevOps' }));

      // El grupo e intereses de DevOps desaparecen de la lista de opciones
      expect(screen.queryByRole('checkbox', { name: 'Docker y Contenedores' })).not.toBeInTheDocument();

      // El interés de Ciberseguridad permanece visible y seleccionado
      const cryptoStillThere = screen.getByRole('checkbox', { name: 'Criptografía' });
      expect(cryptoStillThere).toBeInTheDocument();
      expect(cryptoStillThere).toBeChecked();

      // Al aplicar filtros, el tópico desmarcado de DevOps no se envía en el draft
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
      expect(onApplyMock).toHaveBeenCalledWith({
        areaIds: ['security'],
        topicIds: ['crypto'],
      });
    });
  });

  describe('Tarea 103: Implementar la selección de intereses de mentoría', () => {
    it('permite seleccionar un interés individual y actualiza su estado visual (.is-selected)', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['software'], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const apiTopic = screen.getByRole('checkbox', { name: 'APIs REST' });
      const apiLabel = apiTopic.closest('label');

      expect(apiTopic).not.toBeChecked();
      expect(apiLabel).not.toHaveClass('is-selected');

      fireEvent.click(apiTopic);

      expect(apiTopic).toBeChecked();
      expect(apiLabel).toHaveClass('is-selected');
    });

    it('permite seleccionar múltiples intereses en la misma área y muestra el badge de conteo', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['software'], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const apiTopic = screen.getByRole('checkbox', { name: 'APIs REST' });
      const webTopic = screen.getByRole('checkbox', { name: 'Desarrollo web' });
      const cleanCodeTopic = screen.getByRole('checkbox', { name: 'Clean Code y patrones' });

      fireEvent.click(apiTopic);
      fireEvent.click(webTopic);
      fireEvent.click(cleanCodeTopic);

      expect(apiTopic).toBeChecked();
      expect(webTopic).toBeChecked();
      expect(cleanCodeTopic).toBeChecked();

      // Verifica el badge con el conteo de seleccionados en el encabezado del área
      expect(screen.getByLabelText('3 seleccionados')).toHaveTextContent('(3)');
    });

    it('permite seleccionar intereses entre diferentes áreas técnicas simultáneamente', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['devops', 'data'], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const dockerTopic = screen.getByRole('checkbox', { name: 'Docker y Contenedores' });
      const sqlTopic = screen.getByRole('checkbox', { name: 'PostgreSQL y SQL' });

      fireEvent.click(dockerTopic);
      fireEvent.click(sqlTopic);

      expect(dockerTopic).toBeChecked();
      expect(dockerTopic.closest('label')).toHaveClass('is-selected');
      expect(sqlTopic).toBeChecked();
      expect(sqlTopic.closest('label')).toHaveClass('is-selected');

      expect(screen.getAllByLabelText('1 seleccionados')).toHaveLength(2);
    });

    it('permite deseleccionar un interés individualmente', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['software'], topicIds: ['api', 'web'] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const apiTopic = screen.getByRole('checkbox', { name: 'APIs REST' });
      const webTopic = screen.getByRole('checkbox', { name: 'Desarrollo web' });

      expect(apiTopic).toBeChecked();
      expect(webTopic).toBeChecked();

      fireEvent.click(apiTopic);

      expect(apiTopic).not.toBeChecked();
      expect(apiTopic.closest('label')).not.toHaveClass('is-selected');
      expect(webTopic).toBeChecked();
      expect(webTopic.closest('label')).toHaveClass('is-selected');
    });

    it('envía los intereses seleccionados al enviar el formulario con Aplicar filtros', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['software'], topicIds: [] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      fireEvent.click(screen.getByRole('checkbox', { name: 'APIs REST' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Pruebas automatizadas' }));

      fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

      expect(onApplyMock).toHaveBeenCalledTimes(1);
      expect(onApplyMock).toHaveBeenCalledWith({
        areaIds: ['software'],
        topicIds: ['api', 'testing'],
      });
    });

    it('limpia todos los intereses seleccionados al presionar Limpiar filtros', () => {
      render(
        <MentorDirectoryFilters
          catalog={TEST_CATALOG}
          applied={{ areaIds: ['software'], topicIds: ['api'] }}
          interestsSupported={true}
          disabled={false}
          onApply={onApplyMock}
        />,
      );

      const apiTopic = screen.getByRole('checkbox', { name: 'APIs REST' });
      expect(apiTopic).toBeChecked();

      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

      expect(apiTopic).not.toBeChecked();
      expect(onApplyMock).toHaveBeenCalledWith({ areaIds: [], topicIds: [] });
    });
  });
});

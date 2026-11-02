import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { DEMO_ADMIN_ASSIGNMENT_ID, DEMO_CAREER_ID } from './demo-accounts';

// Los reportes HTTP se generan con las solicitudes de la épica 1; no son archivos estáticos.
const DEMO_SURVEY_ID = '99000000-0000-4000-8000-000000000001';

export const reportes: Array<Prisma.ReporteCreateManyInput & { id: string }> = [];
export const encuestas: Array<Prisma.EncuestaCreateManyInput & { id: string }> = [
  {
    id: DEMO_SURVEY_ID,
    id_administrador: DEMO_ADMIN_ASSIGNMENT_ID,
    id_carrera: DEMO_CAREER_ID,
    titulo: 'Seguimiento laboral - Demostración',
    fecha_inicio: new Date('2026-01-01T00:00:00Z'),
    fecha_fin: new Date('2026-12-31T00:00:00Z'),
    fecha_creacion: new Date(),
    estado: 'BORRADOR',
    formato: 'WEB',
  },
];

const graduateNames = [
  ['Ana', 'Rojas'],
  ['Diego', 'Mendoza'],
  ['Valeria', 'Paredes'],
  ['Marco', 'Salvatierra'],
  ['Camila', 'Vargas'],
  ['Luis', 'Fernández'],
  ['Daniela', 'Quiroga'],
  ['Andrés', 'Céspedes'],
  ['Gabriela', 'Rivera'],
  ['Mateo', 'Soria'],
  ['Lucía', 'Arce'],
  ['Javier', 'Prado'],
  ['Carla', 'Molina'],
  ['Pablo', 'Arias'],
  ['Fernanda', 'Guzmán'],
  ['Sergio', 'López'],
  ['Natalia', 'Cárdenas'],
  ['Rodrigo', 'Villarroel'],
  ['Mariana', 'Suárez'],
  ['Nicolás', 'Torres'],
  ['Paola', 'Cruz'],
  ['Esteban', 'Ríos'],
  ['Andrea', 'Fuentes'],
  ['Kevin', 'Salinas'],
  ['Mónica', 'Vega'],
  ['René', 'Calderón'],
  ['Isabel', 'Pinto'],
  ['Bruno', 'Camacho'],
  ['Sofía', 'Iriarte'],
  ['Álvaro', 'Siles'],
  ['Claudia', 'Montenegro'],
  ['Tomás', 'Lima'],
  ['Verónica', 'Orellana'],
  ['Gabriel', 'Méndez'],
  ['Elena', 'Rocha'],
  ['Héctor', 'Torrico'],
  ['Patricia', 'Alarcón'],
  ['Mauricio', 'Gutiérrez'],
  ['Jimena', 'Bustos'],
] as const;

function demoId(prefix: string, sequence: number): string {
  return `${prefix}-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;
}

const demoGraduates: Prisma.TituladoCreateManyInput[] = graduateNames.map(
  ([nombre, apellido], index) => ({
    id: demoId('99100000', index + 1),
    id_carrera: DEMO_CAREER_ID,
    nombre,
    apellido,
    anio_ingreso: 2016 + (index % 7),
    anio_egreso: 2021 + (index % 5),
    grado: 'Licenciatura',
    expedido_en: 'CB',
  }),
);

// La cuenta titulado@umss.edu.bo queda sin respuesta para que QA pueda enviar la encuesta y ver el guardado.
const respondentIds = demoGraduates.map(({ id }) => id);

type EmploymentResponse = Omit<
  Prisma.RespuestaEncuestaCreateManyInput,
  'id' | 'idEncuesta' | 'idTitulado' | 'fechaEnvio'
>;

const responseScenarios: Array<EmploymentResponse | null> = [
  {
    condicionLaboral: 'true',
    cargo: 'Analista de datos',
    empresa: 'Andes Analytics',
    area: 'Tecnología',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Desarrollador backend',
    empresa: 'Quarksoft Bolivia',
    area: 'Desarrollo de software',
    modalidad: 'Remoto',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '2',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Ingeniera de soporte',
    empresa: 'Cooperativa San Martín',
    area: 'Tecnología',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '9',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Desarrollador frontend',
    empresa: 'Nube Andina',
    area: 'Desarrollo de software',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Asistente de proyectos',
    empresa: 'Constructora Tunari',
    area: 'Gestión de proyectos',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '15',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Administradora de bases de datos',
    empresa: 'DataSur',
    area: 'Tecnología',
    modalidad: 'Remoto',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '2',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Analista de calidad de software',
    empresa: 'Soluciones Kuntur',
    area: 'Desarrollo de software',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Consultor independiente',
    empresa: 'Servicios profesionales propios',
    area: 'Consultoría tecnológica',
    modalidad: 'Remoto',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '2',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Especialista de redes',
    empresa: 'Telecom Valle',
    area: 'Infraestructura',
    modalidad: 'Presencial',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '9',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Desarrolladora móvil',
    empresa: 'Yungas Digital',
    area: 'Desarrollo de software',
    modalidad: 'Remoto',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Técnico de soporte',
    empresa: 'Universidad del Valle Central',
    area: 'Soporte técnico',
    modalidad: 'Presencial',
    salarioMensual: '0–2.999',
    tiempoInsercion: '9',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Analista de seguridad informática',
    empresa: 'Bóveda Ciberseguridad',
    area: 'Seguridad informática',
    modalidad: 'Hibrido',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '2',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Asistente de análisis de negocio',
    empresa: 'Banco Metropolitano',
    area: 'Análisis de negocio',
    modalidad: 'Hibrido',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Desarrollador de aplicaciones',
    empresa: 'Pacha Labs',
    area: 'Desarrollo de software',
    modalidad: 'Remoto',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '9',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Coordinadora de proyectos',
    empresa: 'Fundación Horizonte',
    area: 'Gestión de proyectos',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '15',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Ingeniero de infraestructura cloud',
    empresa: 'Altura Cloud',
    area: 'Infraestructura',
    modalidad: 'Remoto',
    salarioMensual: '12.001–21.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Analista de inteligencia de negocios',
    empresa: 'Mercado Andino',
    area: 'Análisis de datos',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '2',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Soporte de aplicaciones',
    empresa: 'Clínica Los Álamos',
    area: 'Soporte técnico',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '9',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Desarrolladora full stack',
    empresa: 'Chaski Tecnología',
    area: 'Desarrollo de software',
    modalidad: 'Hibrido',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Administrador de sistemas',
    empresa: 'Servicios Mineros del Sur',
    area: 'Infraestructura',
    modalidad: 'Presencial',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '15',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Consultora de transformación digital',
    empresa: 'Independiente',
    area: 'Consultoría tecnológica',
    modalidad: 'Remoto',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '4',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Analista de infraestructura',
    empresa: 'Redes del Centro',
    area: 'Infraestructura',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '9',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Desarrollador de software',
    empresa: 'Cóndor Sistemas',
    area: 'Desarrollo de software',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '2',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Especialista de datos',
    empresa: 'Observatorio Económico Andino',
    area: 'Análisis de datos',
    modalidad: 'Remoto',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '4',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Líder técnica de proyectos',
    empresa: 'Innovación Cercado',
    area: 'Gestión de proyectos',
    modalidad: 'Hibrido',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '9',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Analista de soporte TI',
    empresa: 'Caja Popular Cochabamba',
    area: 'Soporte técnico',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Desarrollador de soluciones cloud',
    empresa: 'Inti Digital',
    area: 'Infraestructura',
    modalidad: 'Remoto',
    salarioMensual: '8.001–12.000',
    tiempoInsercion: '2',
  },
  null,
  {
    condicionLaboral: 'true',
    cargo: 'Analista de procesos',
    empresa: 'Logística Cordillera',
    area: 'Análisis de negocio',
    modalidad: 'Hibrido',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '15',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Desarrolladora de software',
    empresa: 'Wara Tech',
    area: 'Desarrollo de software',
    modalidad: 'Remoto',
    salarioMensual: '5.001–8.000',
    tiempoInsercion: '4',
  },
  {
    condicionLaboral: 'true',
    cargo: 'Asistente de seguridad informática',
    empresa: 'Red Segura Bolivia',
    area: 'Seguridad informática',
    modalidad: 'Presencial',
    salarioMensual: '3.000–5.000',
    tiempoInsercion: '9',
  },
  null,
];

const respuestas: Prisma.RespuestaEncuestaCreateManyInput[] = responseScenarios.slice(0, respondentIds.length).map(
  (scenario, index) => {
    const idTitulado = respondentIds[index];
    if (!idTitulado) {
      throw new Error(`Falta el titulado de demostración para la respuesta ${index + 1}`);
    }
    return {
      ...(scenario ?? { condicionLaboral: 'false' }),
      id: demoId('99200000', index + 1),
      idEncuesta: DEMO_SURVEY_ID,
      idTitulado,
      // Cada 7 días desde el 15/01/2026: la última queda antes de la fecha actual del sprint.
      fechaEnvio: new Date(Date.UTC(2026, 0, 15 + index * 7)),
    };
  },
);

export async function seedEpic9(prisma: PrismaClient): Promise<void> {
  await prisma.titulado.createMany({ data: demoGraduates, skipDuplicates: true });
  if (reportes.length > 0) {
    await prisma.reporte.createMany({ data: reportes, skipDuplicates: true });
  }
  if (encuestas.length > 0) {
    await prisma.encuesta.createMany({ data: encuestas, skipDuplicates: true });
  }
  await prisma.respuestaEncuesta.createMany({ data: respuestas, skipDuplicates: true });
}

import type { RadarArea } from './entities/radar-area';

export interface KeywordDefinition {
  term: string;
  aliases?: string[];
  weight: number;
}

export type RadarDictionary = Record<RadarArea, KeywordDefinition[]>;

const entry = (term: string, weight: number, aliases: string[] = []): KeywordDefinition => ({
  term,
  weight,
  aliases,
});

/** Catálogo de dominio compartido por el cálculo y el seed del radar. */
export const RADAR_DICTIONARY: RadarDictionary = {
  'software-development': [
    entry('javascript', 5, ['js']),
    entry('typescript', 5, ['ts']),
    entry('node.js', 5, ['nodejs', 'node']),
    entry('react', 5, ['reactjs', 'react.js']),
    entry('angular', 4),
    entry('desarrollo de software', 5),
    entry('arquitectura de software', 4),
    entry('java', 4),
    entry('python', 3),
    entry('sql', 3),
    entry('postgresql', 3, ['postgres']),
    entry('api rest', 4, ['rest api', 'restful']),
    entry('c++', 4),
    entry('c#', 4),
    entry('spring boot', 4),
    entry('backend', 3),
    entry('frontend', 3),
    entry('git', 2),
  ],
  'cloud-devops': [
    entry('aws', 5, ['amazon web services']),
    entry('google cloud', 5, ['gcp']),
    entry('arquitectura cloud', 4),
    entry('azure', 5),
    entry('docker', 5),
    entry('kubernetes', 5, ['k8s']),
    entry('terraform', 4),
    entry('devops', 5),
    entry('ci cd', 4, ['cicd']),
    entry('github actions', 4),
    entry('linux', 3),
    entry('solutions architect', 4),
    entry('git', 2),
  ],
  'data-ai': [
    entry('pandas', 4),
    entry('tensorflow', 5),
    entry('machine learning', 5, ['ml']),
    entry('power bi', 4),
    entry('ciencia de datos', 5),
    entry('inteligencia artificial', 5, ['ia']),
    entry('analisis de datos', 4),
    entry('big data', 4),
    entry('nlp', 4),
    entry('python', 4),
    entry('sql', 4),
    entry('postgresql', 3),
  ],
  'quality-assurance': [
    entry('qa', 5, ['quality assurance', 'aseguramiento de calidad']),
    entry('selenium', 5),
    entry('cypress', 5),
    entry('jest', 4),
    entry('postman', 3),
    entry('pruebas automatizadas', 5),
    entry('pruebas de software', 4),
    entry('control de calidad', 4),
  ],
  'cybersecurity-networks': [
    entry('ciberseguridad', 5, ['seguridad informatica']),
    entry('pentesting', 5, ['pruebas de penetracion']),
    entry('ccna', 5),
    entry('owasp', 5),
    entry('firewall', 4),
    entry('criptografia', 4),
    entry('hacking etico', 5),
    entry('redes de computadoras', 3),
  ],
  'it-management': [
    entry('scrum', 4),
    entry('gestion de proyectos', 5),
    entry('gestion de ti', 5),
    entry('tech lead', 4, ['lider tecnico']),
    entry('pmp', 5),
    entry('itil', 5),
    entry('agile', 4, ['agil', 'agiles', 'metodologias agiles']),
    entry('jira', 2),
    entry('liderazgo de equipos', 4),
    entry('cobit', 4),
    entry('gobierno de ti', 4),
  ],
};

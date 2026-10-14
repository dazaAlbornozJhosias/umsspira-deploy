/**
 * Búsqueda simulada del reclutador (Sprint 1, HU-4).
 *
 * No usa backend: interpreta las palabras de la búsqueda, las asocia a las 6 áreas de afinidad
 * y ordena a los candidatos por el porcentaje que ya trae su mock en esas áreas.
 * No elimina candidatos ni inventa porcentajes.
 *
 * TODO: [Épica 2 y cálculo de afinidad] - Reemplazar por la consulta real al backend cuando exista.
 */

export interface AreaPointLike {
  area?: unknown;
  affinity?: unknown;
}

export interface SearchableCandidate {
  skills: string[];
  areas?: ReadonlyArray<AreaPointLike>;
}

type AreaKey = 'software' | 'cloud' | 'data' | 'quality' | 'security' | 'management';

// Palabras de la búsqueda que activan cada área (en minúscula y sin tildes)
const AREA_KEYWORDS: Record<AreaKey, string[]> = {
  software: [
    'software', 'desarrollo', 'development', 'programacion', 'backend', 'frontend', 'fullstack',
    'full', 'stack', 'web', 'api', 'apis', 'microservicios', 'microservicio', 'arquitectura',
    'react', 'angular', 'vue', 'next', 'nextjs', 'nest', 'nestjs', 'node', 'nodejs', 'js',
    'javascript', 'typescript', 'ts', 'java', 'spring', 'php', 'laravel', 'c#', 'c++', 'dotnet',
  ],
  cloud: [
    'cloud', 'nube', 'devops', 'infraestructura', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'k8s', 'terraform', 'ansible', 'linux', 'contenedores', 'ci', 'cd', 'cicd', 'jenkins', 'serverless',
  ],
  data: [
    'datos', 'data', 'ciencia', 'ia', 'ai', 'ml', 'machine', 'learning', 'python', 'sql', 'pandas',
    'tensorflow', 'pytorch', 'analytics', 'analisis', 'bigdata', 'nlp', 'estadistica', 'etl', 'powerbi', 'bi',
  ],
  quality: [
    'calidad', 'qa', 'quality', 'assurance', 'aseguramiento', 'testing', 'test', 'pruebas', 'selenium',
    'cypress', 'jest', 'automatizacion', 'playwright', 'postman',
  ],
  security: [
    'ciberseguridad', 'seguridad', 'redes', 'cybersecurity', 'security', 'networks', 'network',
    'pentesting', 'firewall', 'owasp', 'criptografia', 'hacking', 'forense', 'vpn',
  ],
  management: [
    'gestion', 'ti', 'it', 'management', 'itil', 'scrum', 'agile', 'agil', 'proyectos', 'proyecto',
    'gobernanza', 'cobit', 'pmo', 'liderazgo', 'pmbok', 'kanban',
  ],
};

// Palabras con las que se reconoce cada área dentro del nombre que trae el mock
const AREA_NAME_HINTS: Record<AreaKey, string[]> = {
  software: ['desarrollo', 'software', 'development'],
  cloud: ['cloud', 'devops', 'infraestructura'],
  data: ['datos', 'data', 'ia', 'ai', 'ciencia', 'science'],
  quality: ['calidad', 'qa', 'quality', 'assurance', 'aseguramiento'],
  security: ['ciberseguridad', 'seguridad', 'redes', 'cybersecurity', 'security', 'networks'],
  management: ['gestion', 'ti', 'it', 'management', 'gobernanza'],
};

const AREA_KEYS = Object.keys(AREA_KEYWORDS) as AreaKey[];

const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const tokenize = (text: string): string[] =>
  normalize(text).split(/[^a-z0-9+#]+/).filter(Boolean);

function detectAreas(query: string): AreaKey[] {
  const tokens = new Set(tokenize(query));
  return AREA_KEYS.filter((key) => AREA_KEYWORDS[key].some((keyword) => tokens.has(keyword)));
}

function areaKeyOf(areaName: unknown): AreaKey | null {
  const words = new Set(tokenize(String(areaName ?? '')));
  return AREA_KEYS.find((key) => AREA_NAME_HINTS[key].some((hint) => words.has(hint))) ?? null;
}

// Porcentaje del candidato en un área; si falta o no es numérico cuenta como 0
function percentageOf(candidate: SearchableCandidate, key: AreaKey): number {
  let best = 0;
  for (const point of candidate.areas ?? []) {
    if (areaKeyOf(point.area) !== key) continue;
    const value = Number(point.affinity);
    if (Number.isFinite(value)) best = Math.max(best, Math.min(100, Math.max(0, value)));
  }
  return best;
}

// Cantidad de palabras buscadas que aparecen entre las habilidades (solo desempata)
function skillMatches(candidate: SearchableCandidate, tokens: string[]): number {
  const skillWords = new Set(candidate.skills.flatMap((skill) => tokenize(skill)));
  
  // Filtramos duplicados usando una función compatible con ES5 de forma nativa
  const uniqueTokens = tokens.filter((token, index) => tokens.indexOf(token) === index);
  
  return uniqueTokens.filter((token) => skillWords.has(token)).length;
}


/**
 * Ordena los candidatos de mayor a menor promedio de afinidad en las áreas que la búsqueda menciona.
 * Si no se reconoce ninguna palabra, devuelve la lista en su orden original.
 */
export function rankCandidatesByQuery<T extends SearchableCandidate>(candidates: T[], query: string): T[] {
  const areas = detectAreas(query);
  if (areas.length === 0) return [...candidates];

  const tokens = tokenize(query);

  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: areas.reduce((sum, key) => sum + percentageOf(candidate, key), 0) / areas.length,
      skills: skillMatches(candidate, tokens),
    }))
    .sort((a, b) => b.score - a.score || b.skills - a.skills || a.index - b.index)
    .map((item) => item.candidate);
}
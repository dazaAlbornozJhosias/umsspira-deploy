import { Applicant } from "../types/applicant";

/* ============================================================
   CONFIGURACIÓN
   Los postulantes SON DATOS DE PRUEBA hasta que exista la API de la Epic 5.
   Cuando exista, en .env.local pon:
       NEXT_PUBLIC_USE_MOCK=false
       NEXT_PUBLIC_API_URL=http://localhost:3000
   ============================================================ */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Solo para probar con datos de prueba:
//   "ok" | "empty" (CA-07) | "error" (CA-08 / CA-09)
type MockScenario = "ok" | "empty" | "error";
const MOCK_SCENARIO: MockScenario = "ok";

export const MATCH_ENGINE_ERROR_MESSAGE = "Error de conexión con el motor de coincidencia";

export class MatchEngineError extends Error {
  constructor(message = MATCH_ENGINE_ERROR_MESSAGE) {
    super(message);
    this.name = "MatchEngineError";
  }
}

/* ============================================================
   ÚNICO PUNTO DE ADAPTACIÓN DE LA RESPUESTA
   Si la API usa otros nombres de campo, solo se cambia aquí.
   Nunca se calcula ni se inventa el porcentaje (CA-02, CA-10).
   ============================================================ */
interface RawApplicant {
  id: string | number;
  name: string;
  email: string;
  location: string;
  experienceLevel: Applicant["experienceLevel"];
  status: Applicant["status"];
  appliedAt?: string | null;
  cvUrl?: string | null;
  matchPercentage?: number | null;
  skills?: Applicant["skills"];
}

function normalizeApplicant(raw: RawApplicant): Applicant {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    location: raw.location,
    experienceLevel: raw.experienceLevel,
    status: raw.status,
    appliedAt: raw.appliedAt ?? null,
    cvUrl: raw.cvUrl ?? null,
    // Ejemplo si la API usara otros nombres: raw.porcentaje_match
    matchPercentage:
      typeof raw.matchPercentage === "number" && Number.isFinite(raw.matchPercentage)
        ? raw.matchPercentage
        : null,
    skills: Array.isArray(raw.skills) ? raw.skills : null,
  };
}

/* ============================================================
   DATOS DE PRUEBA
   ============================================================ */
const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "app-1",
    name: "Carlos Rojas",
    email: "carlos.rojas@email.com",
    location: "Cochabamba, Bolivia",
    experienceLevel: "Senior",
    status: "En revisión",
    appliedAt: "2025-09-10",
    cvUrl: null,
    matchPercentage: 92,
    skills: [
      { skill: "Node.js", percentage: 100 },
      { skill: "TypeScript", percentage: 90 },
      { skill: "REST API", percentage: 80 },
      { skill: "PostgreSQL", percentage: 80 },
      { skill: "Docker", percentage: 70 },
      { skill: "AWS", percentage: 60 },
    ],
  },
  {
    id: "app-2",
    name: "María López",
    email: "maria.lopez@email.com",
    location: "Cochabamba, Bolivia",
    experienceLevel: "Senior",
    status: "En revisión",
    appliedAt: "2025-09-08",
    cvUrl: null,
    matchPercentage: 85,
    skills: [
      { skill: "Python", percentage: 95 },
      { skill: "FastAPI", percentage: 90 },
      { skill: "PostgreSQL", percentage: 80 },
      { skill: "Docker", percentage: 75 },
    ],
  },
  {
    id: "app-3",
    name: "Luis Fernández",
    email: "luis.fernandez@email.com",
    location: "Quillacollo, Cochabamba",
    experienceLevel: "Semi-Senior",
    status: "Preseleccionado",
    appliedAt: "2025-09-06",
    cvUrl: null,
    matchPercentage: 78,
    skills: [
      { skill: "Java", percentage: 85 },
      { skill: "Spring Boot", percentage: 80 },
      { skill: "MySQL", percentage: 75 },
      { skill: "Docker", percentage: 65 },
    ],
  },
  {
    id: "app-4",
    name: "Ana Torres",
    email: "ana.torres@email.com",
    location: "Cochabamba, Bolivia",
    experienceLevel: "Semi-Senior",
    status: "En revisión",
    appliedAt: "2025-09-05",
    cvUrl: null,
    matchPercentage: 72,
    skills: [
      { skill: "Node.js", percentage: 80 },
      { skill: "JavaScript", percentage: 75 },
      { skill: "MongoDB", percentage: 70 },
      { skill: "REST API", percentage: 65 },
    ],
  },
  {
    // Caso CA-10: el motor no devolvió porcentaje
    id: "app-5",
    name: "Luis Mamani",
    email: "luis.mamani@email.com",
    location: "Sacaba, Cochabamba",
    experienceLevel: "Junior",
    status: "Postulado",
    appliedAt: "2025-09-04",
    cvUrl: null,
    matchPercentage: null,
    skills: null,
  },
];

/* ============================================================
   HELPERS DE RED
   ============================================================ */
async function apiGet(path: string): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      // credentials: "include",                          // si usan cookies de sesión
      // headers: { Authorization: `Bearer ${token}` },   // si usan token
    });
  } catch {
    // Error de conexión (CA-08)
    throw new MatchEngineError();
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new MatchEngineError();
  }
}

/* ============================================================
   SERVICIO PÚBLICO (lanzan MatchEngineError si fallan)
   ============================================================ */

/** Lista de postulantes de una vacante. */
export async function getApplicantsByVacancy(vacancyId: string): Promise<Applicant[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (MOCK_SCENARIO === "error") throw new MatchEngineError();
    if (MOCK_SCENARIO === "empty") return [];
    return MOCK_APPLICANTS;
  }

  const res = await apiGet(`/api/v1/vacancies/${vacancyId}/applicants`);
  if (!res.ok) throw new MatchEngineError(); // Error del servidor (CA-09)

  const data = await readJson(res);
  // Si la API responde { data: [...] }, usar: (data as { data: RawApplicant[] }).data
  if (!Array.isArray(data)) throw new MatchEngineError();

  return (data as RawApplicant[]).map(normalizeApplicant);
}

/** Detalle de un postulante. Devuelve null si no existe. */
export async function getApplicantById(
  vacancyId: string,
  applicantId: string
): Promise<Applicant | null> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (MOCK_SCENARIO === "error") throw new MatchEngineError();
    return MOCK_APPLICANTS.find((a) => a.id === applicantId) ?? null;
  }

  const res = await apiGet(`/api/v1/vacancies/${vacancyId}/applicants/${applicantId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new MatchEngineError();

  const data = await readJson(res);
  return normalizeApplicant(data as RawApplicant);
}
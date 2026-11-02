import { getAccessToken } from "@/shared/services/auth-session";
import { API_BASE_URL } from "../config/api";
import { Vacancy, VacancyStatus } from "../types/vacancy";

/* Las vacantes SIEMPRE vienen de la API real (no dependen de NEXT_PUBLIC_USE_MOCK,
   que es solo para los postulantes). */

interface RawVacancy {
  id: string | number;
  titulo?: string | null;
  estado?: string | null;
  created_at?: string | null;
}

/** Misma traducción de estados que usa la página "Mis vacantes". */
function normalizeStatus(raw: unknown): VacancyStatus {
  const estado = String(raw ?? "").toUpperCase().trim();
  if (["PUBLICADO", "PUBLICADA", "ACTIVA", "ACTIVO", "ACTIVE", "PUBLISHED"].includes(estado)) {
    return "Activa";
  }
  if (["PAUSADO", "PAUSADA", "PAUSED"].includes(estado)) return "Pausada";
  if (["CERRADO", "CERRADA", "CLOSED"].includes(estado)) return "Cerrada";
  return "Borrador";
}

/** Convierte created_at a "aaaa-mm-dd" en hora local (igual que la lista de vacantes). */
function toLocalIsoDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Datos básicos de la vacante (título, fecha y estado).
 * Todavía no se sabe si existe GET /api/v1/vacantes/:id, así que se busca la
 * vacante dentro de /mis-vacantes. Si el backend lo confirma, solo se cambia esta función.
 */
export async function getVacancyById(vacancyId: string): Promise<Vacancy> {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/v1/vacantes/mis-vacantes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo cargar la vacante");

  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Respuesta de vacantes no válida");

  const found = (data as RawVacancy[]).find((v) => String(v.id) === vacancyId);
  if (!found) throw new Error("Vacante no encontrada");

  return {
    id: String(found.id),
    title: found.titulo || "Sin título",
    publishedAt: toLocalIsoDate(found.created_at),
    status: normalizeStatus(found.estado),
  };
}
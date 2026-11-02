export type VacancyStatus = "Activa" | "Pausada" | "Cerrada" | "Borrador";

export interface Vacancy {
  id: string;
  title: string;
  /** Fecha de publicación en formato ISO local (ej. "2025-09-10"). Vacía si no hay fecha. */
  publishedAt: string;
  status: VacancyStatus;
}
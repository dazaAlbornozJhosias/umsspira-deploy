"use client";

import { useState } from "react";
import { authenticatedFetch, SessionError } from "@/shared/services/auth-session";
import { readApiError } from "@/shared/services/api-contract";

const API_BASE_URL = "/api/v1";

export type ReviewDecision = "APROBADA" | "OBSERVADA" | "RECHAZADA";

export type ReviewPayload = {
  decision: ReviewDecision;
  category?: string; // obligatoria si OBSERVADA o RECHAZADA (causal)
  note?: string; // mínimo 10 caracteres si OBSERVADA o RECHAZADA
  notifyDean?: boolean; // checkbox del diseño de Observar
};

export const MIN_NOTE_LENGTH = 10;
export const MAX_NOTE_LENGTH = 500;

// TODO: confirmar las listas reales con el equipo
export const OBSERVATION_CATEGORIES = [
  "Documento ilegible",
  "Documento incompleto",
  "Datos incorrectos",
  "Documento vencido",
  "Otro",
];

export const REJECTION_CAUSES = [
  "Documentación falsa o adulterada",
  "No cumple los requisitos de egreso",
  "Identidad no verificada en SEGIP",
  "Trámite duplicado",
  "Otro",
];

type Options = {
  applicationId: string;
  onSuccess?: () => void;
};

export function useReview({ applicationId, onSuccess }: Options) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReview(payload: ReviewPayload) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.status === 401) {
        setError("Tu sesión expiró. Inicia sesión de nuevo como administrador.");
        return false;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(readApiError(body, "No se pudo registrar el dictamen. Intenta de nuevo.").message);
        return false;
      }

      onSuccess?.();
      return true;
    } catch (error) {
      setError(error instanceof SessionError ? error.message : "No se pudo registrar el dictamen. Intenta de nuevo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { submitReview, isLoading, error };
}

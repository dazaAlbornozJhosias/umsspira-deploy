"use client";

import { useState } from "react";
import { authStore } from "@/modules/auth/frontend/store/auth.store";
import { getSessionToken } from "@/modules/auth/frontend/services/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type ReviewDecision = "APPROVED" | "OBSERVED" | "REJECTED";

export type ReviewPayload = {
  decision: ReviewDecision;
  category?: string; // obligatoria si OBSERVED o REJECTED (causal)
  note?: string; // mínimo 10 caracteres si OBSERVED o REJECTED
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
      const token = authStore.getState().accessToken ?? getSessionToken();
      const response = await fetch(
        `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        const message = body?.message ?? body?.error;
        setError(Array.isArray(message) ? message[0] : (message ?? "No se pudo registrar el dictamen. Intenta de nuevo."));
        return false;
      }

      onSuccess?.();
      return true;
    } catch {
      setError("No se pudo registrar el dictamen. Intenta de nuevo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { submitReview, isLoading, error };
}
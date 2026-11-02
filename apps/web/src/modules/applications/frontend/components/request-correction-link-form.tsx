"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { FormSelect } from "@/modules/registration/frontend/components/form-select";
import {
  EXPEDITION_DEPARTMENTS,
  EXPEDITION_LABELS,
  personalDataSchema,
} from "@/modules/registration/frontend/validation/personal-data.schema";
import { requestCorrectionLink } from "../services/application.service";

const EXPEDITION_OPTIONS = EXPEDITION_DEPARTMENTS.map((code) => ({
  value: code,
  label: EXPEDITION_LABELS[code],
}));

const requestSchema = z.object({
  ci: personalDataSchema.shape.ci,
  complemento: personalDataSchema.shape.complementoCi.optional(),
  expedidoEn: personalDataSchema.shape.expedidoEn,
});

export function RequestCorrectionLinkForm() {
  const [ci, setCi] = useState("");
  const [complemento, setComplemento] = useState("");
  const [expedidoEn, setExpedidoEn] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);

    const parsed = requestSchema.safeParse({
      ci,
      complemento: complemento || undefined,
      expedidoEn,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "general";
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await requestCorrectionLink({
        ci: parsed.data.ci,
        complemento: parsed.data.complemento,
        expedidoEn: parsed.data.expedidoEn,
      });

      if (result.status === "success") {
        setSuccessMessage(result.message);
      } else {
        setGeneralError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div
        role="alert"
        className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center text-sm font-medium text-green-900"
      >
        <p>{successMessage}</p>
        <p className="mt-2 text-xs text-green-700">
          Revisa tu bandeja de entrada y la carpeta de correo no deseado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-left">
      <h2 className="text-base font-bold text-slate-900 text-center">
        Solicitar nuevo enlace de corrección
      </h2>
      <p className="text-xs text-slate-600 text-center">
        Ingresa los datos de identidad registrados en tu solicitud para enviarte un enlace vigente.
      </p>

      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"
        >
          {generalError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="C.I."
          required
          inputMode="numeric"
          maxLength={10}
          value={ci}
          onChange={(e) => setCi(e.target.value.replace(/\D/g, ""))}
          error={errors.ci}
        />
        <Input
          label="Complemento (Opcional)"
          placeholder="Ej. 1A"
          maxLength={2}
          value={complemento}
          onChange={(e) => setComplemento(e.target.value.toUpperCase())}
          error={errors.complemento}
        />
      </div>

      <FormSelect
        label="Expedido en"
        required
        placeholder="Selecciona departamento"
        options={EXPEDITION_OPTIONS}
        value={expedidoEn}
        onChange={(e) => setExpedidoEn(e.target.value)}
        error={errors.expedidoEn}
      />

      <Button
        type="submit"
        disabled={submitting}
        className="mt-2 w-full justify-center bg-[#B5533C] text-white hover:bg-[#9c432f]"
      >
        {submitting ? "Enviando solicitud..." : "Solicitar enlace"}
      </Button>
    </form>
  );
}

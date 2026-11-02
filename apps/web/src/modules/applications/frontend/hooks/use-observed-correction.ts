"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DOCUMENT_ERROR_MESSAGES,
  validateDocumentFile,
} from "@/modules/documents/frontend/validation/document-file";
import { personalDataSchema } from "@/modules/registration/frontend/validation/personal-data.schema";

export type CorrectionValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  ci: string;
  complement: string;
  issuedIn: string;
  email: string;
  phone: string;
  career: string;
  graduationYear: string;
  sisCode: string;
  documentType: string;
};

export type CorrectionErrors = Partial<Record<keyof CorrectionValues | "file", string>>;

export type CorrectionResult = {
  values: CorrectionValues;
  changedFields: (keyof CorrectionValues)[];
  file: File | null;
  emailChanged: boolean;
};

const REQUIRED_MESSAGE = "Este campo es obligatorio.";

// Campo del formulario -> campo del schema del registro original (CA-10.3).
const SCHEMA_KEY = {
  firstName: "nombres",
  lastName: "apellidos",
  ci: "ci",
  complement: "complementoCi",
  issuedIn: "expedidoEn",
  email: "correo",
  phone: "telefono",
  career: "carreraId",
  graduationYear: "anioEgreso",
  sisCode: "codigoSis",
} as const;

function validateField(name: keyof CorrectionValues, value: string): string | null {
  if (name === "birthDate") return value.trim() ? null : REQUIRED_MESSAGE;
  if (name === "documentType") {
    return value.trim() ? null : DOCUMENT_ERROR_MESSAGES.missingType;
  }
  const rule = personalDataSchema.shape[SCHEMA_KEY[name]];
  const result = rule.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? REQUIRED_MESSAGE;
}

export function useObservedCorrection(initial: CorrectionValues) {
  const [values, setValues] = useState<CorrectionValues>(initial);
  const [file, setFileState] = useState<File | null>(null);
  const [errors, setErrors] = useState<CorrectionErrors>({});

  const changedFields = useMemo(
    () =>
      (Object.keys(values) as (keyof CorrectionValues)[]).filter(
        (k) => values[k] !== initial[k],
      ),
    [values, initial],
  );

  const hasChanges = changedFields.length > 0 || file !== null;
  const emailChanged =
    values.email.trim().toLowerCase() !== initial.email.trim().toLowerCase();

  const setValue = useCallback((name: keyof CorrectionValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) ?? undefined }));
  }, []);

  const setFileError = useCallback((message: string | null) => {
    setErrors((prev) => ({ ...prev, file: message ?? undefined }));
  }, []);

  const setFile = useCallback(async (next: File | null) => {
    if (!next) {
      // No limpiar el error: el dropzone llama a onFileSelect(null) justo después de rechazar un archivo.
      setFileState(null);
      return;
    }
    const kind = await validateDocumentFile(next);
    if (!kind) {
      setFileState(null);
      setErrors((prev) => ({ ...prev, file: DOCUMENT_ERROR_MESSAGES.invalidFile }));
      return;
    }
    setFileState(next);
    setErrors((prev) => ({ ...prev, file: undefined }));
  }, []);

  const validateAll = useCallback((): CorrectionResult | null => {
    const next: CorrectionErrors = {};
    (Object.keys(values) as (keyof CorrectionValues)[]).forEach((k) => {
      const e = validateField(k, values[k]);
      if (e) next[k] = e;
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return null;
    return { values, changedFields, file, emailChanged };
  }, [values, file, changedFields, emailChanged]);

  return {
    values,
    file,
    errors,
    hasChanges,
    emailChanged,
    setValue,
    setFile,
    setFileError,
    validateAll,
  };
}
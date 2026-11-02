"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DocumentDropzone } from "@/modules/documents/frontend/components/document-dropzone";
import {
  EXPEDITION_DEPARTMENTS,
  EXPEDITION_LABELS,
} from "@/modules/registration/frontend/validation/personal-data.schema";
import {
  fetchCareers,
  type Career,
} from "@/modules/registration/frontend/services/registration.service";
import {
  useObservedCorrection,
  type CorrectionResult,
  type CorrectionValues,
} from "../hooks/use-observed-correction";

type Props = {
  initial: CorrectionValues;
  currentDocument: { name: string; sizeLabel: string; uploadedAt: string; url: string };
  onReview: (result: CorrectionResult) => void;
  onRequireEmailVerification?: (result: CorrectionResult) => void;
  onCancel: () => void;
};

// TODO: tomar los tipos de documento del módulo documents (document-upload-step.tsx).
const DOCUMENT_TYPES = [
  "Título en Provisión Nacional",
  "Diploma Académico",
  "Certificado de egreso",
];

const inputClass =
  "w-full rounded-md border border-transparent bg-[#EDE8DE] px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none aria-[invalid=true]:border-red-600";

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Card({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-xs text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ObservedEditForm({
  initial,
  currentDocument,
  onReview,
  onRequireEmailVerification,
  onCancel,
}: Props) {
  const c = useObservedCorrection(initial);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCareers()
      .then((data) => {
        if (active) {
          setCareers(data);
          setLoadingCareers(false);
        }
      })
      .catch(() => {
        if (active) setLoadingCareers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const text = (
    name: keyof CorrectionValues,
    label: string,
    opts?: { required?: boolean; type?: string },
  ) => (
    <Field id={name} label={label} required={opts?.required} error={c.errors[name]}>
      <input
        id={name}
        type={opts?.type ?? "text"}
        value={c.values[name]}
        onChange={(e) => c.setValue(name, e.target.value)}
        aria-invalid={Boolean(c.errors[name])}
        aria-describedby={c.errors[name] ? `${name}-error` : undefined}
        className={inputClass}
      />
    </Field>
  );

  function handleSubmit() {
    const result = c.validateAll();
    if (!result) return;
    if (result.emailChanged && onRequireEmailVerification) {
      onRequireEmailVerification(result);
    } else {
      onReview(result);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card n={1} title="Datos personales y contacto">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("firstName", "Nombres", { required: true })}
          {text("lastName", "Apellidos", { required: true })}
          {text("birthDate", "Fecha de nacimiento", { required: true, type: "date" })}
          {text("ci", "Cédula de Identidad (C.I.)", { required: true })}
          {text("complement", "Complemento (Opcional)")}
          <Field id="issuedIn" label="Expedido en" required error={c.errors.issuedIn}>
            <select
              id="issuedIn"
              value={c.values.issuedIn}
              onChange={(e) => c.setValue("issuedIn", e.target.value)}
              aria-invalid={Boolean(c.errors.issuedIn)}
              aria-describedby={c.errors.issuedIn ? "issuedIn-error" : undefined}
              className={inputClass}
            >
              <option value="">Selecciona</option>
              {EXPEDITION_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {EXPEDITION_LABELS[d]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="email" label="Correo electrónico" required error={c.errors.email}>
            <input
              id="email"
              type="email"
              value={c.values.email}
              readOnly
              aria-readonly="true"
              className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              El correo electrónico registrado no puede modificarse en este formulario. Si necesitas actualizarlo, comunícate con administración.
            </p>
          </Field>
          {text("phone", "Teléfono celular / WhatsApp", { required: true, type: "tel" })}
        </div>
      </Card>

      <Card n={2} title="Datos académicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="career" label="Carrera universitaria" required error={c.errors.career}>
              <select
                id="career"
                value={c.values.career}
                onChange={(e) => c.setValue("career", e.target.value)}
                disabled={loadingCareers}
                aria-invalid={Boolean(c.errors.career)}
                aria-describedby={c.errors.career ? "career-error" : undefined}
                className={inputClass}
              >
                <option value="">
                  {loadingCareers ? "Cargando carreras..." : "Selecciona tu carrera"}
                </option>
                {careers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {text("graduationYear", "Año de conclusión de estudios / egreso", { required: true })}
          {text("sisCode", "Código SIS")}
        </div>
      </Card>

      <Card n={3} title="Documento de respaldo">
        <div className="rounded-lg bg-[#EDE8DE] p-4">
          <p className="text-sm font-bold text-slate-900">{currentDocument.name}</p>
          <p className="text-xs text-slate-600">
            {currentDocument.sizeLabel} • Subido el {currentDocument.uploadedAt}
          </p>
          <a
            href={currentDocument.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-bold underline"
          >
            Ver documento previo
          </a>
        </div>

        <div className="mt-4">
          <Field
            id="documentType"
            label="Tipo de documento que presentas"
            required
            error={c.errors.documentType}
          >
            <select
              id="documentType"
              value={c.values.documentType}
              onChange={(e) => c.setValue("documentType", e.target.value)}
              aria-invalid={Boolean(c.errors.documentType)}
              aria-describedby={c.errors.documentType ? "documentType-error" : undefined}
              className={inputClass}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-slate-700">
            Reemplazar documento (opcional)
          </p>
          <DocumentDropzone
            file={c.file}
            onFileSelect={c.setFile}
            error={c.errors.file ?? null}
            onErrorChange={c.setFileError}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-600 hover:underline"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!c.hasChanges}
          className="rounded-lg bg-[#B5533C] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Revisar cambios
        </button>
      </div>
    </div>
  );
}

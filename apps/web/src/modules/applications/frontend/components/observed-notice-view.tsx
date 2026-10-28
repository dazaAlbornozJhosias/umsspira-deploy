"use client";

import { useEffect, useState, type ReactNode } from "react";

type Observation = { category: string; note: string };

type ObservedApplication = {
  observedAt: string;
  observations: Observation[];
  form: {
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
  };
  document: { name: string; sizeLabel: string; uploadedAt: string; url: string; type: string };
};

type ViewState =
  | { status: "loading" }
  | { status: "valid"; data: ObservedApplication }
  | { status: "invalid" | "expired" | "not-observed" };

// TODO: reemplazar por la llamada real al backend (GET con el token).
// Mapear la respuesta: 200 -> valid, 404 -> invalid, 410 -> expired, 409 -> not-observed.
async function fetchObservedApplication(token: string): Promise<ViewState> {
  await new Promise((r) => setTimeout(r, 400));
  if (token === "invalido") return { status: "invalid" };
  if (token === "vencido") return { status: "expired" };
  if (token === "no-observada") return { status: "not-observed" };
  return {
    status: "valid",
    data: {
      observedAt: "2026-10-22T11:30:00",
      observations: [
        {
          category: "Datos personales y contacto",
          note: "El documento adjunto no es completamente legible. Adjunta una copia más clara de los sellos y firmas de egreso.",
        },
        {
          category: "Documento de respaldo",
          note: "El documento adjunto no es completamente legible. Adjunta una copia más clara de los sellos y firmas de egreso.",
        },
      ],
      form: {
        firstName: "Juan Carlos",
        lastName: "Pérez Mamani",
        birthDate: "1998-05-14",
        ci: "6842109",
        complement: "",
        issuedIn: "CB",
        email: "carlos.perez.m@correo.com",
        phone: "+591 70745821",
        career: "Licenciatura en Ingeniería de Sistemas",
        graduationYear: "2023",
        sisCode: "201804921",
      },
      document: {
        name: "Certificado_Conclusion_Estudios_JuanPerez.pdf",
        sizeLabel: "4.2 MB",
        uploadedAt: "2026-10-20",
        url: "#",
        type: "Título en Provisión Nacional",
      },
    },
  };
}

const STATUS_MESSAGES = {
  invalid: {
    title: "Enlace no válido",
    text: "Este enlace no corresponde a ninguna solicitud observada. Verifica que lo hayas copiado completo desde tu correo.",
  },
  expired: {
    title: "Enlace vencido",
    text: "Este enlace ya no está vigente. Si tu solicitud sigue observada, puedes pedir que te enviemos uno nuevo al correo verificado.",
  },
  "not-observed": {
    title: "Esta solicitud ya no está observada",
    text: "No es posible editarla desde este enlace porque su estado cambió.",
  },
} as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReadOnlyField({
  label,
  value,
  required,
}: {
  label: string;
  value: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="min-h-[40px] rounded-md bg-[#EDE8DE] px-3 py-2 text-sm text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}

function SectionCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-xs text-white">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusMessage({ kind }: { kind: keyof typeof STATUS_MESSAGES }) {
  const { title, text } = STATUS_MESSAGES[kind];
  return (
    <div
      role="alert"
      className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm text-slate-600">{text}</p>
      {/* TODO (CA-10.6): botón "Solicitar enlace nuevo" en una rama posterior */}
    </div>
  );
}

export function ObservedNoticeView({ token }: { token: string }) {
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetchObservedApplication(token)
      .then((result) => active && setState(result))
      .catch(() => active && setState({ status: "invalid" }));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#EDE8DE] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {state.status === "loading" && (
          <p role="status" className="mt-16 text-center text-sm text-slate-600">
            Cargando tu solicitud…
          </p>
        )}

        {(state.status === "invalid" ||
          state.status === "expired" ||
          state.status === "not-observed") && <StatusMessage kind={state.status} />}

        {state.status === "valid" && <ValidView data={state.data} />}
      </div>
    </main>
  );
}

function ValidView({ data }: { data: ObservedApplication }) {
  const { form, document, observations } = data;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <span className="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-800">
          Expediente observado • Subsanación
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Corrige tu solicitud</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu solicitud fue revisada y necesita algunas correcciones para continuar con el proceso
          oficial.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 border-l-4 border-l-[#B5533C] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="rounded bg-[#B5533C] px-2 py-0.5 text-xs font-bold text-white">
            Observaciones
          </span>
          <time className="text-xs text-slate-500" dateTime={data.observedAt}>
            {formatDateTime(data.observedAt)}
          </time>
        </div>
        <ul className="flex flex-col gap-4">
          {observations.map((o, i) => (
            <li key={i}>
              <p className="mb-2 text-sm font-bold text-slate-900">Categoría: {o.category}</p>
              <blockquote className="rounded-lg bg-[#EDE8DE] p-4 text-sm font-medium text-slate-800">
                {o.note}
              </blockquote>
            </li>
          ))}
        </ul>
      </section>

      <SectionCard number={1} title="Datos personales y contacto">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Nombres" value={form.firstName} required />
          <ReadOnlyField label="Apellidos" value={form.lastName} required />
          <ReadOnlyField label="Fecha de nacimiento" value={form.birthDate} required />
          <ReadOnlyField label="Cédula de Identidad (C.I.)" value={form.ci} required />
          <ReadOnlyField label="Complemento (Opcional)" value={form.complement} />
          <ReadOnlyField label="Expedido en" value={form.issuedIn} required />
          <ReadOnlyField label="Correo electrónico" value={form.email} required />
          <ReadOnlyField label="Teléfono celular / WhatsApp" value={form.phone} required />
        </div>
      </SectionCard>

      <SectionCard number={2} title="Datos académicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ReadOnlyField label="Carrera universitaria" value={form.career} />
          </div>
          <ReadOnlyField
            label="Año de conclusión de estudios / egreso"
            value={form.graduationYear}
            required
          />
          <ReadOnlyField label="Código SIS" value={form.sisCode} />
        </div>
      </SectionCard>

      <SectionCard number={3} title="Documento de respaldo">
        <div className="rounded-lg bg-[#EDE8DE] p-4">
          <p className="text-sm font-bold text-slate-900">{document.name}</p>
          <p className="text-xs text-slate-600">
            {document.sizeLabel} • Subido el {document.uploadedAt}
          </p>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-bold text-slate-900 underline"
          >
            Ver documento previo
          </a>
        </div>
        <div className="mt-4">
          <ReadOnlyField label="Tipo de documento" value={document.type} required />
        </div>
      </SectionCard>

      {/* TODO T-10.6: reemplazo de documento, campos editables y botón "Revisar cambios" */}

      <p className="rounded-lg border border-slate-200 bg-white/60 p-3 text-center text-xs text-slate-600">
        La corrección de datos se realiza directamente sobre el mismo expediente oficial sin
        generar un trámite duplicado.
      </p>
    </div>
  );
}

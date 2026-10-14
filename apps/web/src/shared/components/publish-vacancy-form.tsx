"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lightbulb,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ApiError, apiFetch, clearToken } from "@/shared/services/api-client";

interface VacancyFormData {
  title: string;
  modality: string;
  experienceLevel: string;
  technicalDescription: string;
}

const initialFormData: VacancyFormData = {
  title: "",
  modality: "",
  experienceLevel: "",
  technicalDescription: "",
};

type Feedback = { type: "success" | "error"; text: string } | null;

const inputBase =
  "w-full rounded-lg border bg-[#EEE9DF] text-sm text-abyssal outline-none transition focus:bg-white focus:ring-1 focus:ring-[#2C3B4D]";

export function PublishVacancyForm() {
  const [formData, setFormData] = useState<VacancyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof VacancyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFeedback(null);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const borderFor = (field: string) =>
    errors[field] ? "border-red-500" : "border-oatmeal focus:border-[#2C3B4D]";

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500">{errors[field]}</p>
    ) : null;

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setFeedback(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.title.trim()) next.title = "El título es obligatorio";
    if (!formData.modality) next.modality = "Selecciona la modalidad";
    if (!formData.experienceLevel) next.experienceLevel = "Selecciona el nivel de experiencia";
    if (!formData.technicalDescription.trim()) {
      next.technicalDescription = "La descripción técnica es obligatoria";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setFeedback(null);
    try {
      await apiFetch("/api/vacantes", {
        method: "POST",
        body: JSON.stringify({
          titulo: formData.title.trim(),
          modalidad: formData.modality,
          nivelExperiencia: formData.experienceLevel,
          descripcionTecnica: formData.technicalDescription.trim(),
        }),
      });
      setFormData(initialFormData);
      setErrors({});
      setFeedback({ type: "success", text: "Vacante publicada correctamente ✅" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
        window.location.href = "/login";
        return;
      }
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Ocurrió un error inesperado",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E3] text-[#D97720]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-abyssal">Publicar una vacante</h1>
          </div>
          <p className="ml-[52px] text-sm text-[#66717C]">
            Completa la información de la vacante para encontrar al perfil que buscas.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-[#E4DED3] bg-white p-6 shadow-sm sm:p-8">
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
              className="space-y-6"
            >
              {/* Primera fila */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-semibold text-abyssal">
                    Título <span className="text-[#A35139]">*</span>
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A929A]" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={(event) => setField("title", event.target.value)}
                      placeholder="Ej. Desarrollador Frontend"
                      className={`${inputBase} ${borderFor("title")} h-11 pl-10 pr-3 placeholder:text-[#8A929A]`}
                    />
                  </div>
                  {fieldError("title")}
                </div>

                <div>
                  <label htmlFor="modality" className="mb-2 block text-sm font-semibold text-abyssal">
                    Modalidad <span className="text-[#A35139]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#8A929A]" />
                    <select
                      id="modality"
                      name="modality"
                      value={formData.modality}
                      onChange={(event) => setField("modality", event.target.value)}
                      className={`${inputBase} ${borderFor("modality")} h-11 appearance-none pl-10 pr-9`}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="PRESENCIAL">PRESENCIAL</option>
                      <option value="HIBRIDO">HIBRIDO</option>
                      <option value="REMOTO">REMOTO</option>
                    </select>
                  </div>
                  {fieldError("modality")}
                </div>
              </div>

              {/* Nivel de experiencia */}
              <div>
                <label
                  htmlFor="experienceLevel"
                  className="mb-2 block text-sm font-semibold text-abyssal"
                >
                  Nivel de experiencia <span className="text-[#A35139]">*</span>
                </label>
                <div className="relative">
                  <ClipboardCheck className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#8A929A]" />
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={(event) => setField("experienceLevel", event.target.value)}
                    className={`${inputBase} ${borderFor("experienceLevel")} h-11 appearance-none pl-10 pr-9`}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="SIN_EXPERIENCIA">Sin experiencia</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SEMI_SENIOR">Semi Senior</option>
                    <option value="SENIOR">Senior</option>
                  </select>
                </div>
                {fieldError("experienceLevel")}
              </div>

              {/* Descripción técnica */}
              <div>
                <label
                  htmlFor="technicalDescription"
                  className="mb-2 block text-sm font-semibold text-abyssal"
                >
                  Descripción técnica <span className="text-[#A35139]">*</span>
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#8A929A]" />
                  <textarea
                    id="technicalDescription"
                    name="technicalDescription"
                    rows={6}
                    value={formData.technicalDescription}
                    onChange={(event) => setField("technicalDescription", event.target.value)}
                    placeholder="Describe las responsabilidades, conocimientos técnicos, herramientas y requisitos necesarios para el puesto."
                    className={`${inputBase} ${borderFor("technicalDescription")} resize-none py-3 pl-10 pr-3 leading-6 placeholder:text-[#8A929A]`}
                  />
                </div>
                {fieldError("technicalDescription")}
                <p className="mt-2 text-xs text-[#7B858E]">
                  Incluye tecnologías, herramientas y conocimientos necesarios.
                </p>
              </div>

              {/* Mensaje */}
              {feedback && (
                <div
                  role={feedback.type === "error" ? "alert" : "status"}
                  className={
                    feedback.type === "error"
                      ? "rounded-lg border border-red-500 bg-red-50 p-3 text-sm font-semibold text-red-700"
                      : "rounded-lg border border-green-500 bg-green-50 p-3 text-sm font-semibold text-green-800"
                  }
                >
                  {feedback.text}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 border-t border-[#EEE9DF] pt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="h-11 rounded-lg border border-oatmeal bg-white px-6 text-sm font-semibold text-abyssal transition hover:bg-[#F7F4EE] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-lg bg-burning-flame px-6 text-sm font-bold text-abyssal shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#2C3B4D] focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Publicando..." : "Publicar vacante"}
                </button>
              </div>
            </form>
          </section>

          {/* Panel lateral */}
          <aside className="rounded-2xl border border-[#E4DED3] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E3] text-[#D97720]">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-abyssal">Consejos para una buena publicación</h2>
                <p className="mt-1 text-xs leading-5 text-[#7B858E]">
                  Una buena oferta ayuda a encontrar mejores candidatos.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Tip text="Usa un título claro y directo para el puesto." />
              <Tip text="Describe las habilidades y conocimientos necesarios." />
              <Tip text="Menciona las herramientas y tecnologías que utilizará." />
              <Tip text="Revisa la información antes de publicar la vacante." />
            </div>

            <div className="mt-6 rounded-xl border border-[#F2D8B8] bg-[#FFF8EE] p-4">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D97720]" />
                <p className="text-xs leading-5 text-[#59636D]">
                  Una buena descripción ayuda a que los estudiantes comprendan mejor qué perfil estás buscando.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D97720]" />
      <p className="text-sm leading-5 text-[#59636D]">{text}</p>
    </div>
  );
}
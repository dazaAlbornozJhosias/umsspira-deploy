'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  EditRecordLayout,
  FormField,
  INPUT_CLASS,
  RecordNotFound,
} from '@/modules/profile/components/edit-record-layout';
import { recordsHref } from '@/modules/profile/data/profile-records-data';
import { actualizarExperiencia } from '@/modules/profile/services/perfil-api';
import { useProfileStore } from '@/modules/profile/state/profile-store';
import type { ExperienceRecord } from '@/modules/profile/types/profile-record';
import { MensajeError, claseCampo } from '@/modules/profile/validation/mensaje-error';
import { FECHA_MINIMA_EXPERIENCIA, validarRangoFechas } from '@/modules/profile/validation/reglas-perfil';
import { ApiError } from '@/shared/services/api-client';

type ExperienceFormData = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
};

export function EditExperienceForm() {
  const { id } = useParams<{ id: string }>();
  const { records } = useProfileStore();
  const experience = (records.experience as ExperienceRecord[]).find((record) => record.id === id);

  if (!experience) return <RecordNotFound label="experiencia laboral" />;

  return <EditExperienceFields key={experience.id} experience={experience} />;
}

function EditExperienceFields({ experience }: { experience: ExperienceRecord }) {
  const router = useRouter();
  const { updateRecord } = useProfileStore();

  const [formData, setFormData] = useState<ExperienceFormData>({
    company: experience.company,
    position: experience.position,
    startDate: experience.startDate,
    endDate: experience.endDate,
  });
  // Sin fecha de fin = trabajo actual (igual que en "Completar perfil")
  const [isCurrentJob, setIsCurrentJob] = useState(!experience.endDate);
  const [isSaved, setIsSaved] = useState(false);
  // Fecha fin anterior a la fecha inicio (misma regla que al crear); una vez mostrado se recalcula mientras se corrige
  const [endDateError, setEndDateError] = useState<string>();
  // Mensaje del backend al guardar (400...), tal como lo envía
  const [saveError, setSaveError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    setIsSaved(false);
    setSaveError(undefined);
    if (endDateError) setEndDateError(validarRangoFechas(next.startDate, next.endDate));
  }

  function handleCurrentJobChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsCurrentJob(event.target.checked);
    if (event.target.checked) setFormData((current) => ({ ...current, endDate: '' }));
    setIsSaved(false);
    setEndDateError(undefined);
    setSaveError(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const error = isCurrentJob ? undefined : validarRangoFechas(formData.startDate, formData.endDate);
    setEndDateError(error);
    if (error) return;

    setIsSaving(true);
    try {
      const actualizada = await actualizarExperiencia(experience.id, {
        empresa: formData.company,
        cargo: formData.position,
        fechaInicio: formData.startDate,
        fechaFin: isCurrentJob ? undefined : formData.endDate,
      });
      updateRecord('experience', actualizada);
      setIsSaved(true);
    } catch (apiError) {
      if (!(apiError instanceof ApiError)) throw apiError;
      setSaveError(apiError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <EditRecordLayout
      title="Editar experiencia laboral"
      description="Modifica los datos de esta experiencia laboral y guarda los cambios."
      number="02"
      sectionTitle="Experiencia laboral"
      sectionSubtitle="Tu experiencia profesional más relevante"
      isSaved={isSaved}
      onSubmit={handleSubmit}
      onCancel={() => router.push(recordsHref('experience'))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="company" label="Empresa">
          <input id="company" name="company" type="text" value={formData.company} onChange={handleChange} required className={INPUT_CLASS} />
        </FormField>
        <FormField id="position" label="Cargo">
          <input id="position" name="position" type="text" value={formData.position} onChange={handleChange} required className={INPUT_CLASS} />
        </FormField>
        <FormField id="startDate" label="Fecha inicio">
          <input
            id="startDate"
            name="startDate"
            type="date"
            min={FECHA_MINIMA_EXPERIENCIA}
            value={formData.startDate}
            onChange={handleChange}
            required
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField id="endDate" label="Fecha fin">
          <input
            id="endDate"
            name="endDate"
            type="date"
            min={FECHA_MINIMA_EXPERIENCIA}
            value={formData.endDate}
            onChange={handleChange}
            required={!isCurrentJob}
            disabled={isCurrentJob}
            aria-invalid={Boolean(endDateError)}
            aria-describedby="error-endDate"
            className={claseCampo(INPUT_CLASS, endDateError)}
          />
          <MensajeError id="error-endDate" mensaje={endDateError} />
        </FormField>
      </div>

      <label className="flex w-fit items-center gap-2 text-[13px] text-blue-fantastic">
        <input
          type="checkbox"
          checked={isCurrentJob}
          onChange={handleCurrentJobChange}
          className="h-4 w-4 accent-truffle-trouble"
        />
        Actualmente trabajo aquí
      </label>

      <MensajeError id="error-experience-save" mensaje={saveError} />
    </EditRecordLayout>
  );
}

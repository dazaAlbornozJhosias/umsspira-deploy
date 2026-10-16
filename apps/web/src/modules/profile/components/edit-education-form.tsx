'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  BackupField,
  EditRecordLayout,
  FormField,
  INPUT_CLASS,
  RecordNotFound,
} from '@/modules/profile/components/edit-record-layout';
import { urlDeArchivo } from '@/modules/profile/utils/backup-url';
import { recordsHref } from '@/modules/profile/data/profile-records-data';
import { actualizarFormacion } from '@/modules/profile/services/perfil-api';
import { useProfileStore } from '@/modules/profile/state/profile-store';
import type { EducationRecord } from '@/modules/profile/types/profile-record';
import { MensajeError, claseCampo } from '@/modules/profile/validation/mensaje-error';
import {
  LARGO_MAXIMO_FORMACION,
  validarAnioEgreso,
  validarFormacionDuplicada,
} from '@/modules/profile/validation/reglas-perfil';
import { ApiError } from '@/shared/services/api-client';

type EducationFormData = {
  institution: string;
  title: string;
  graduationYear: string;
  degree: string;
};

// Mismos grados que el formulario de formación académica de "Completar perfil"
const DEGREES = ['Técnico superior', 'Licenciatura', 'Maestría', 'Doctorado'];

export function EditEducationForm() {
  const { id } = useParams<{ id: string }>();
  const { records } = useProfileStore();
  const education = (records.education as EducationRecord[]).find((record) => record.id === id);

  if (!education) return <RecordNotFound label="formación académica" />;

  return <EditEducationFields key={education.id} education={education} />;
}

function EditEducationFields({ education }: { education: EducationRecord }) {
  const router = useRouter();
  const { records, updateRecord } = useProfileStore();

  const [formData, setFormData] = useState<EducationFormData>({
    institution: education.institution,
    title: education.title,
    graduationYear: education.graduationYear,
    degree: education.degree,
  });
  const [documentName, setDocumentName] = useState(education.backupFile ?? '');
  const [documentUrl, setDocumentUrl] = useState(education.backupUrl);
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Mismas reglas que al crear; el error del año se recalcula mientras se corrige
  const [yearError, setYearError] = useState<string>();
  // Formación duplicada (validación del frontend) o mensaje del backend (409, 400...) tal como lo envía
  const [saveError, setSaveError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = event.target;
    const value = name === 'graduationYear' ? event.target.value.replace(/\D/g, '') : event.target.value;
    setFormData((current) => ({ ...current, [name]: value }));
    setIsSaved(false);
    setSaveError(undefined);
    if (name === 'graduationYear' && yearError) setYearError(validarAnioEgreso(value));
  }

  function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      setDocumentUrl(urlDeArchivo(file));
      setIsNewDocument(true);
      setIsSaved(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const formacion = {
      institucion: formData.institution,
      titulo: formData.title,
      anioEgreso: formData.graduationYear,
      grado: formData.degree,
    };

    const error = validarAnioEgreso(formacion.anioEgreso);
    setYearError(error);
    if (error) return;
    // El propio registro no cuenta como duplicado
    const otras = (records.education as EducationRecord[])
      .filter((record) => record.id !== education.id)
      .map((record) => ({ institucion: record.institution, titulo: record.title, anioEgreso: record.graduationYear }));
    const duplicada = validarFormacionDuplicada(formacion, otras);
    setSaveError(duplicada);
    if (duplicada) return;

    setIsSaving(true);
    try {
      const actualizada = await actualizarFormacion(education.id, formacion);
      // El respaldo de la formación no se guarda en la API: se conserva el del estado
      updateRecord('education', {
        ...actualizada,
        backupFile: documentName || undefined,
        backupUrl: documentName ? documentUrl : undefined,
      });
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
      title="Editar formación académica"
      description="Modifica los datos de esta formación académica y guarda los cambios."
      number="01"
      sectionTitle="Formación académica"
      sectionSubtitle="Tu formación académica principal"
      isSaved={isSaved}
      onSubmit={handleSubmit}
      onCancel={() => router.push(recordsHref('education'))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="institution" label="Institución">
          <input
            id="institution"
            name="institution"
            type="text"
            value={formData.institution}
            onChange={handleChange}
            required
            maxLength={LARGO_MAXIMO_FORMACION}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField id="title" label="Título">
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={LARGO_MAXIMO_FORMACION}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField id="graduationYear" label="Año de egreso">
          <input
            id="graduationYear"
            name="graduationYear"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            title="Ingresa un año de 4 dígitos"
            value={formData.graduationYear}
            onChange={handleChange}
            required
            aria-invalid={Boolean(yearError)}
            aria-describedby="error-graduationYear"
            className={claseCampo(INPUT_CLASS, yearError)}
          />
          <MensajeError id="error-graduationYear" mensaje={yearError} />
        </FormField>
        <FormField id="degree" label="Grado">
          <select id="degree" name="degree" value={formData.degree} onChange={handleChange} required className={INPUT_CLASS}>
            {DEGREES.map((degree) => (
              <option key={degree} value={degree}>
                {degree}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Un respaldo ya cargado se considera validado; uno nuevo queda en revisión */}
      <BackupField
        documentName={documentName}
        documentUrl={documentUrl}
        isVerified={Boolean(documentName) && !isNewDocument}
        onDocumentChange={handleDocumentChange}
      />

      <MensajeError id="error-education-save" mensaje={saveError} />
    </EditRecordLayout>
  );
}

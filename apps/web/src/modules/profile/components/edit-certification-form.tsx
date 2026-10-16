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
import { recordsHref } from '@/modules/profile/data/profile-records-data';
import { useProfileStore } from '@/modules/profile/state/profile-store';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';

type CertificationFormData = {
  name: string;
  issuer: string;
  year: string;
  degree: string;
};

// Mismos grados que el formulario de certificaciones de "Completar perfil"
const DEGREES = ['Fundamentos', 'Asociado', 'Profesional', 'Especialista', 'Experto'];

export function EditCertificationForm() {
  const { id } = useParams<{ id: string }>();
  const { records } = useProfileStore();
  const certification = (records.certification as CertificationRecord[]).find((record) => record.id === id);

  if (!certification) return <RecordNotFound label="certificación" />;

  return <EditCertificationFields key={certification.id} certification={certification} />;
}

function EditCertificationFields({ certification }: { certification: CertificationRecord }) {
  const router = useRouter();
  const { updateRecord } = useProfileStore();

  const [formData, setFormData] = useState<CertificationFormData>({
    name: certification.name,
    issuer: certification.issuer,
    year: certification.issueYear,
    degree: certification.degree,
  });
  const [documentName, setDocumentName] = useState(certification.backupFile ?? '');
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setIsSaved(false);
  }

  function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      setIsNewDocument(true);
      setIsSaved(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Frontend solamente: actualiza el estado compartido del perfil. El backend se conectará posteriormente.
    updateRecord('certification', {
      ...certification,
      name: formData.name.trim(),
      issuer: formData.issuer.trim(),
      issueYear: formData.year,
      degree: formData.degree,
      backupFile: documentName || undefined,
      // Un respaldo nuevo vuelve a quedar en revisión
      backupVerified: isNewDocument ? false : certification.backupVerified,
    });
    setIsSaved(true);
  }

  return (
    <EditRecordLayout
      title="Editar certificación"
      description="Modifica los datos de esta certificación y guarda los cambios."
      number="03"
      sectionTitle="Certificaciones"
      sectionSubtitle="Credenciales que respaldan tu perfil"
      isSaved={isSaved}
      onSubmit={handleSubmit}
      onCancel={() => router.push(recordsHref('certification'))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="name" label="Nombre de la certificación">
          <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className={INPUT_CLASS} />
        </FormField>
        <FormField id="issuer" label="Entidad emisora">
          <input id="issuer" name="issuer" type="text" value={formData.issuer} onChange={handleChange} required className={INPUT_CLASS} />
        </FormField>
        <FormField id="year" label="Año">
          <input
            id="year"
            name="year"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={formData.year}
            onChange={handleChange}
            required
            className={INPUT_CLASS}
          />
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

      <BackupField
        documentName={documentName}
        isVerified={Boolean(documentName) && !isNewDocument && Boolean(certification.backupVerified)}
        onDocumentChange={handleDocumentChange}
      />
    </EditRecordLayout>
  );
}

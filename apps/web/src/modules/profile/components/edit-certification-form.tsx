'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { BackupViewerModal } from '@/modules/profile/components/backup-viewer-modal';
import {
  BackupField,
  EditRecordLayout,
  FormField,
  INPUT_CLASS,
  RecordNotFound,
} from '@/modules/profile/components/edit-record-layout';
import { urlDeArchivo } from '@/modules/profile/utils/backup-url';
import { recordsHref } from '@/modules/profile/data/profile-records-data';
import {
  actualizarCertificacion,
  esDemoSinBackend,
  obtenerCertificacion,
  subirRespaldo,
} from '@/modules/profile/services/perfil-api';
import { useProfileStore } from '@/modules/profile/state/profile-store';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';
import { MensajeError } from '@/modules/profile/validation/mensaje-error';
import { validarRespaldo } from '@/modules/profile/validation/reglas-perfil';
import { ApiError } from '@/shared/services/api-client';

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
  // Último estado del perfil: al recargar, el guardado del navegador se restaura después del primer render
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const [certification, setCertification] = useState<CertificationRecord | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  // Cambiar este número vuelve a pedir la certificación (botón "Reintentar")
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Si el usuario sale de la pantalla antes de que llegue la respuesta, se ignora
    let ignore = false;
    setStatus('loading');
    obtenerCertificacion(id)
      .then((record) => {
        if (ignore) return;
        setCertification(record);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (ignore) return;
        // Demo sin backend ni login: se edita la certificación guardada en el navegador
        if (esDemoSinBackend(error)) {
          const local = (recordsRef.current.certification as CertificationRecord[]).find((record) => record.id === id);
          setCertification(local ?? null);
          setStatus(local ? 'ready' : 'not-found');
          return;
        }
        // 404: no existe; 403: es de otro egresado. En ambos casos no se muestra el formulario
        const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403);
        setStatus(notFound ? 'not-found' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [id, attempt]);

  if (status === 'loading') return <p className="text-sm text-blue-fantastic">Cargando certificación…</p>;

  if (status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-blue-fantastic">No se pudo cargar la certificación. Revisa tu conexión e inténtalo de nuevo.</p>
        <button
          type="button"
          onClick={() => setAttempt((current) => current + 1)}
          className="rounded-lg border border-oatmeal bg-white px-5 py-2.5 text-sm font-semibold text-blue-fantastic transition hover:bg-palladian"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (status === 'not-found' || !certification) return <RecordNotFound label="certificación" />;

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
  const [documentUrl, setDocumentUrl] = useState(certification.backupUrl);
  const [isNewDocument, setIsNewDocument] = useState(false);
  // Foto JPG elegida que todavía no se subió (T9.4); se conserva si la subida falla
  const [pendingDocument, setPendingDocument] = useState<File | null>(null);
  // Respaldo que ya quedó guardado en el backend; es el que se muestra si la subida falla
  const [savedBackup, setSavedBackup] = useState({
    file: certification.backupFile,
    url: certification.backupUrl,
    verified: certification.backupVerified,
  });
  const [documentError, setDocumentError] = useState<string>();
  const [isSaved, setIsSaved] = useState(false);
  // Mensaje del backend (400, 403, 404) o de conexión, tal como lo envía apiFetch
  const [saveError, setSaveError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setIsSaved(false);
    setSaveError(undefined);
  }

  function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // El accept del input se puede saltar: mismas reglas que el backend (solo JPG, máximo 5 MB)
    const error = validarRespaldo(file);
    setDocumentError(error);
    if (error) return;
    setDocumentName(file.name);
    setDocumentUrl(urlDeArchivo(file));
    setIsNewDocument(true);
    setPendingDocument(file);
    setIsSaved(false);
    setSaveError(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(undefined);
    try {
      // PUT sobre el mismo id: el backend actualiza el registro, no crea uno nuevo
      const actualizada = await actualizarCertificacion(certification.id, {
        nombre: formData.name,
        entidadEmisora: formData.issuer,
        grado: formData.degree,
        anioEmision: formData.year,
      });
      let backup = savedBackup;
      let uploadError: string | undefined;
      // Después del PUT se sube la foto nueva, que reemplaza al respaldo anterior (T9.4)
      if (pendingDocument) {
        try {
          await subirRespaldo(certification.id, pendingDocument);
          // Un respaldo nuevo vuelve a quedar en revisión
          backup = { file: pendingDocument.name, url: documentUrl, verified: false };
          setSavedBackup(backup);
          setPendingDocument(null);
        } catch (apiError) {
          if (!(apiError instanceof ApiError)) throw apiError;
          // CA-08: el registro conserva su respaldo anterior y el formulario la foto elegida para reintentar
          uploadError = apiError.message;
        }
      }
      updateRecord('certification', {
        ...actualizada,
        backupFile: backup.file,
        backupUrl: backup.file ? backup.url : undefined,
        backupVerified: backup.verified,
      });
      if (uploadError) {
        setSaveError(`Los datos se guardaron, pero no se pudo subir el respaldo: ${uploadError}`);
      } else {
        setIsSaved(true);
      }
    } catch (apiError) {
      if (!(apiError instanceof ApiError)) throw apiError;
      // Si falla, el formulario conserva lo escrito y el registro guardado queda como estaba
      setSaveError(apiError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <EditRecordLayout
      title="Editar certificación"
      description="Modifica los datos de esta certificación y guarda los cambios."
      number="03"
      sectionTitle="Certificaciones"
      sectionSubtitle="Credenciales que respaldan tu perfil"
      isSaved={isSaved}
      savedLabel="Registro actualizado"
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
        documentUrl={documentUrl}
        isVerified={Boolean(documentName) && !isNewDocument && Boolean(certification.backupVerified)}
        onDocumentChange={handleDocumentChange}
        onDocumentRemove={() => {
          // Demo: quita solo la imagen; al guardar el registro queda sin respaldo
          setDocumentName('');
          setDocumentUrl(undefined);
          setIsNewDocument(false);
          setPendingDocument(null);
          setSavedBackup({ file: undefined, url: undefined, verified: false });
          setIsSaved(false);
        }}
        // Un archivo recién elegido aún no está en la API: se sigue abriendo con su enlace local
        onViewBackup={documentName && certification.backupFile && !isNewDocument ? () => setIsViewerOpen(true) : undefined}
      />
      <MensajeError id="error-certification-backup" mensaje={documentError} />

      <MensajeError id="error-certification-save" mensaje={saveError} />

      {/* El visor se abre encima del formulario: los campos no se desmontan y conservan lo escrito */}
      {isViewerOpen && (
        <BackupViewerModal
          certificationId={certification.id}
          certificationName={certification.name}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </EditRecordLayout>
  );
}

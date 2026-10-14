'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  CheckIcon,
  FileTextIcon,
  BriefcaseIcon,
  CompassIcon,
  GlobeIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  SaveIcon,
  CameraIcon,
  AlertTriangleIcon,
  XIcon,
} from 'lucide-react';
import { PageLayout } from '@/shared/components/page-layout';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import {
  getMentorProfileInformation,
  updateMentorProfileInformation,
  deleteMentorProfileInformation,
  type MentorProfileInformationData,
} from '../services/mentor-profile-info-api';

const MAX_DESCRIPCION = 500;
const MAX_EXPERIENCIA = 800;
const MAX_RELEVANTE = 500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp'];

function formatDateSpanish(dateStr?: string | null): string {
  if (!dateStr) return '—';
  if (dateStr.includes('de')) return dateStr;
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const [year, month, day] = parts;
      const months = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      return `${day} de ${months[month - 1]}, ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function MentorProfileInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const [exists, setExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [savedData, setSavedData] = useState<MentorProfileInformationData | null>(null);

  // Form state
  const [descripcion, setDescripcion] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [informacionRelevante, setInformacionRelevante] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [formAlertError, setFormAlertError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ descripcion?: string; experiencia?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const state = await getMentorProfileInformation();
      const hasData = state.exists && state.profile && Boolean(state.profile.descripcion || state.profile.experiencia);
      if (hasData && state.profile) {
        setExists(true);
        setSavedData(state.profile);
        setDescripcion(state.profile.descripcion || '');
        setExperiencia(state.profile.experiencia || '');
        setInformacionRelevante(state.profile.informacion_relevante || '');
        setFotoPerfil(state.profile.foto_perfil || null);
        setIsEditing(false);
      } else {
        setExists(false);
        setSavedData(null);
        setDescripcion('');
        setExperiencia('');
        setInformacionRelevante('');
        setFotoPerfil(null);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información del perfil.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  // Dirty check
  const isDirty = exists
    ? descripcion !== (savedData?.descripcion || '') ||
      experiencia !== (savedData?.experiencia || '') ||
      informacionRelevante !== (savedData?.informacion_relevante || '') ||
      fotoPerfil !== (savedData?.foto_perfil || null)
    : descripcion.length > 0 || experiencia.length > 0 || informacionRelevante.length > 0 || fotoPerfil !== null;

  // Validation
  const descripcionExceeded = descripcion.length > MAX_DESCRIPCION;
  const experienciaExceeded = experiencia.length > MAX_EXPERIENCIA;
  const relevanteExceeded = informacionRelevante.length > MAX_RELEVANTE;
  const isOverLimit = descripcionExceeded || experienciaExceeded || relevanteExceeded;

  function handleStartEditing() {
    setError('');
    setSuccessBanner('');
    setFormAlertError('');
    setFieldErrors({});
    setPhotoError('');
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setFieldErrors({});
    setFormAlertError('');
    setPhotoError('');
    if (savedData && (savedData.descripcion || savedData.experiencia)) {
      setDescripcion(savedData.descripcion || '');
      setExperiencia(savedData.experiencia || '');
      setInformacionRelevante(savedData.informacion_relevante || '');
      setFotoPerfil(savedData.foto_perfil || null);
      setIsEditing(false);
    } else {
      setDescripcion('');
      setExperiencia('');
      setInformacionRelevante('');
      setFotoPerfil(null);
      setIsEditing(false);
    }
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setPhotoError('El formato de imagen no es admitido. Selecciona un archivo JPG, PNG o WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPhotoError('La fotografía supera los 5 MB permitidos. Elige un archivo más liviano.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoPerfil(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDeletePhoto() {
    setFotoPerfil(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave() {
    setFieldErrors({});
    setFormAlertError('');
    setError('');
    const errors: { descripcion?: string; experiencia?: string } = {};

    if (!descripcion.trim()) {
      errors.descripcion = 'La descripción profesional es obligatoria.';
    }
    if (!experiencia.trim()) {
      errors.experiencia = 'La experiencia profesional es obligatoria.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.descripcion && errors.experiencia) {
        setFormAlertError('No se pudo guardar. La Descripción profesional y la Experiencia profesional son campos obligatorios.');
      } else if (errors.descripcion) {
        setFormAlertError('No se pudo guardar. La Descripción profesional es obligatoria.');
      } else {
        setFormAlertError('No se pudo guardar. La Experiencia profesional es obligatoria.');
      }
      return;
    }

    if (isOverLimit) return;

    setSaving(true);
    try {
      const state = await updateMentorProfileInformation({
        descripcion: descripcion.trim(),
        experiencia: experiencia.trim(),
        informacion_relevante: informacionRelevante.trim() || null,
        foto_perfil: fotoPerfil,
      });

      if (state.profile) {
        setSavedData(state.profile);
        setDescripcion(state.profile.descripcion || '');
        setExperiencia(state.profile.experiencia || '');
        setInformacionRelevante(state.profile.informacion_relevante || '');
        setFotoPerfil(state.profile.foto_perfil || null);
      }
      setExists(true);
      setIsEditing(false);
      setSuccessBanner('Información actualizada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la información.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteMentorProfileInformation();
      setExists(false);
      setSavedData(null);
      setDescripcion('');
      setExperiencia('');
      setInformacionRelevante('');
      setFotoPerfil(null);
      setShowDeleteModal(false);
      setIsEditing(false);
      setSuccessBanner('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la información del perfil.');
    } finally {
      setDeleting(false);
    }
  }

  // Titles and breadcrumb
  const currentTitle = isEditing
    ? exists
      ? 'Editar información del perfil'
      : 'Agregar información del perfil'
    : exists
      ? 'Información del perfil'
      : 'Agregar información del perfil';

  const currentDescription = isEditing
    ? 'Actualiza tu descripción, experiencia e información relevante para presentar tu trayectoria como mentor.'
    : exists
      ? 'Presenta tu experiencia y conocimientos a quienes buscan orientación en la red de mentorías.'
      : 'Actualiza tu descripción, experiencia e información relevante para presentar tu trayectoria como mentor.';

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Mentorías', href: '/mentorship' },
    { label: 'Mi perfil de mentor', href: '/mentorship/profile' },
    { label: currentTitle },
  ];

  return (
    <main className="mentorship-shell">
      <PageLayout
        breadcrumb={breadcrumbs}
        eyebrow="Red universitaria de desarrollo"
        title={currentTitle}
        description={currentDescription}
      >
        {successBanner && (
          <div className="mb-4">
            <div role="status" className="mentor-info-success-banner">
              <div className="mentor-info-success-left">
                <span className="mentor-info-success-icon" aria-hidden="true">
                  <CheckIcon size={16} strokeWidth={3} />
                </span>
                <span className="mentor-info-success-text">{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner('')}
                className="mentor-info-success-close"
                aria-label="Cerrar notificación"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mentor-api-error mb-4">
            {error}
          </div>
        )}

        <div className="mentor-info-card">
          {/* Header Bar */}
          <header className="mentor-info-header">
            <div className="mentor-info-badge">
              <span className="mentor-info-badge-dot" aria-hidden="true" />
              <span>Mentor activo</span>
            </div>
            <div className="mentor-info-updated">
              <span>Última actualización:</span>
              <strong>{savedData?.fecha_actualizacion || '—'}</strong>
            </div>
          </header>

          {/* Body Content */}
          {loading ? (
            <div role="status" className="mentor-info-empty">
              <p className="mentor-info-empty-subtitle">Cargando información del perfil…</p>
            </div>
          ) : !exists && !isEditing ? (
            /* Estado Vacío */
            <div className="mentor-info-empty">
              <div className="mentor-info-empty-icon" aria-hidden="true">
                <FileTextIcon size={24} />
              </div>
              <h3 className="mentor-info-empty-title">
                Aún no has agregado información a tu perfil de mentor
              </h3>
              <p className="mentor-info-empty-subtitle">
                Agrega tu descripción y experiencia profesional para que otros puedan conocer tu perfil.
              </p>
              <div className="mentor-info-empty-btn">
                <PrimaryButton onClick={handleStartEditing} iconRight={PlusIcon}>
                  + Agregar información
                </PrimaryButton>
              </div>
              <div className="mentor-info-empty-notice">
                <AlertTriangleIcon size={16} aria-hidden="true" />
                <span>Tu perfil no muestra información a los estudiantes hasta que la agregues.</span>
              </div>
            </div>
          ) : !isEditing && savedData ? (
            /* Vista de Lectura */
            <div className="mentor-info-read-body">
              <div className="mentor-info-read-avatar-row">
                {savedData.foto_perfil ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={savedData.foto_perfil}
                    alt="Foto de perfil del mentor"
                    className="mentor-info-avatar-img-sm"
                  />
                ) : (
                  <div className="mentor-info-avatar-placeholder-sm" aria-label="Avatar por defecto">
                    M
                  </div>
                )}
                <div>
                  <h4 className="mentor-info-photo-title">Fotografía de perfil</h4>
                  <p className="mentor-info-photo-desc">
                    Se usa la foto de tu perfil de titulado.
                  </p>
                </div>
              </div>

              <div className="mentor-info-section">
                <div className="mentor-info-section-header">
                  <FileTextIcon size={16} className="text-[#2C3B4D]" aria-hidden="true" />
                  <span className="mentor-info-section-label">Descripción profesional</span>
                </div>
                <p className="mentor-info-section-content">{savedData.descripcion || '—'}</p>
              </div>

              <div className="mentor-info-section">
                <div className="mentor-info-section-header">
                  <BriefcaseIcon size={16} className="text-[#2C3B4D]" aria-hidden="true" />
                  <span className="mentor-info-section-label">Experiencia profesional</span>
                </div>
                <p className="mentor-info-section-content">{savedData.experiencia || '—'}</p>
              </div>

              {savedData.informacion_relevante && (
                <div className="mentor-info-section">
                  <div className="mentor-info-section-header">
                    <CompassIcon size={16} className="text-[#2C3B4D]" aria-hidden="true" />
                    <span className="mentor-info-section-label">Información relevante para la mentoría</span>
                  </div>
                  <p className="mentor-info-section-content">{savedData.informacion_relevante}</p>
                </div>
              )}

              {/* Aviso público */}
              <div className="mentor-info-public-box">
                <GlobeIcon size={16} className="flex-shrink-0" aria-hidden="true" />
                <span>Esta información es visible públicamente en el directorio de titulados. Solo tú puedes modificarla.</span>
              </div>

              {/* Botones al pie en modo lectura */}
              <div className="mentor-info-footer">
                <SecondaryButton
                  onClick={() => setShowDeleteModal(true)}
                  className="mentor-info-btn-danger"
                >
                  <Trash2Icon className="icon mr-1.5" aria-hidden="true" />
                  Eliminar información
                </SecondaryButton>
                <PrimaryButton onClick={handleStartEditing} iconRight={PencilIcon}>
                  Editar información
                </PrimaryButton>
              </div>
            </div>
          ) : (
            /* Formulario de Edición */
            <form
              onSubmit={e => {
                e.preventDefault();
                void handleSave();
              }}
            >
              <div className="mentor-info-form-body">
                {/* Sección Fotografía */}
                <section className="mentor-info-photo-section">
                  <div className="mentor-info-photo-header">
                    <h4>Fotografía de perfil</h4>
                    <span>(opcional)</span>
                  </div>
                  <p className="mentor-info-photo-hint">
                    Se mostrará en el directorio de mentores y en tu perfil detallado. JPG, PNG o WEBP, hasta 5 MB.
                  </p>

                  <div className="mentor-info-photo-controls">
                    {fotoPerfil ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={fotoPerfil}
                        alt="Vista previa de foto de perfil"
                        className="mentor-info-avatar-img"
                      />
                    ) : (
                      <div className="mentor-info-avatar-placeholder" aria-label="Avatar por defecto">
                        M
                      </div>
                    )}

                    <div className="mentor-info-photo-actions">
                      <p className="mentor-info-photo-actions-note">
                        Se usa la foto de tu perfil de titulado.
                      </p>
                      <div className="mentor-info-photo-btn-group">
                        <button
                          type="button"
                          className="mentor-info-btn-change-photo"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <CameraIcon size={16} aria-hidden="true" />
                          Cambiar foto
                        </button>
                        {fotoPerfil && (
                          <button
                            type="button"
                            className="mentor-info-btn-delete-photo"
                            onClick={handleDeletePhoto}
                          >
                            <Trash2Icon size={16} aria-hidden="true" />
                            Eliminar foto
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                        aria-label="Subir fotografía de perfil"
                      />
                      {photoError && (
                        <p role="alert" className="mentor-info-photo-error">
                          {photoError}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Banner de error de validación superior si se intenta guardar incompleto */}
                {formAlertError && (
                  <div role="alert" className="mentor-info-validation-alert">
                    <CircleAlertIcon size={18} className="flex-shrink-0" aria-hidden="true" />
                    <div>
                      <strong>No se pudo guardar.</strong>{' '}
                      <span>{formAlertError.replace('No se pudo guardar. ', '')}</span>
                    </div>
                  </div>
                )}

                {/* Caja de aviso obligatorios */}
                <div className="mentor-info-alert-box">
                  <CircleAlertIcon size={18} aria-hidden="true" />
                  <span>
                    Los campos marcados con <strong className="mentor-info-alert-required">*</strong> son
                    obligatorios. La información guardada será visible en el directorio de titulados.
                  </span>
                </div>

                {/* Campo Descripción profesional */}
                <div className="mentor-info-field">
                  <div className="mentor-info-field-top">
                    <label htmlFor="field-descripcion" className="mentor-info-label">
                      Descripción profesional
                      <span className="mentor-info-req-star">*</span>
                    </label>
                    <span
                      className={`mentor-info-counter ${descripcionExceeded ? 'is-limit' : ''}`}
                    >
                      {descripcion.length} / {MAX_DESCRIPCION}
                    </span>
                  </div>
                  <p className="mentor-info-hint">
                    Breve resumen personal y tu motivación para orientar a otros miembros de la comunidad.
                  </p>
                  <textarea
                    id="field-descripcion"
                    rows={4}
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Ej. Ingeniero de Sistemas con experiencia en desarrollo de software..."
                    className={`mentor-info-textarea ${fieldErrors.descripcion || descripcionExceeded ? 'has-error' : ''}`}
                  />
                  {fieldErrors.descripcion && (
                    <p role="alert" className="mentor-info-field-error">
                      <CircleAlertIcon size={14} className="inline mr-1" aria-hidden="true" />
                      {fieldErrors.descripcion}
                    </p>
                  )}
                  {descripcionExceeded && (
                    <p role="alert" className="mentor-info-field-error">
                      <CircleAlertIcon size={14} className="inline mr-1" aria-hidden="true" />
                      La descripción no debe superar los {MAX_DESCRIPCION} caracteres.
                    </p>
                  )}
                </div>

                {/* Campo Experiencia profesional */}
                <div className="mentor-info-field">
                  <div className="mentor-info-field-top">
                    <label htmlFor="field-experiencia" className="mentor-info-label">
                      Experiencia profesional
                      <span className="mentor-info-req-star">*</span>
                    </label>
                    <span
                      className={`mentor-info-counter ${experienciaExceeded ? 'is-limit' : ''}`}
                    >
                      {experiencia.length} / {MAX_EXPERIENCIA}
                    </span>
                  </div>
                  <p className="mentor-info-hint">
                    Roles laborales más relevantes, proyectos y trayectoria técnica.
                  </p>
                  <textarea
                    id="field-experiencia"
                    rows={4}
                    value={experiencia}
                    onChange={e => setExperiencia(e.target.value)}
                    placeholder="Ej. Tech Lead en proyectos de arquitectura backend..."
                    className={`mentor-info-textarea ${fieldErrors.experiencia || experienciaExceeded ? 'has-error' : ''}`}
                  />
                  {fieldErrors.experiencia && (
                    <p role="alert" className="mentor-info-field-error">
                      <CircleAlertIcon size={14} className="inline mr-1" aria-hidden="true" />
                      {fieldErrors.experiencia}
                    </p>
                  )}
                  {experienciaExceeded && (
                    <p role="alert" className="mentor-info-field-error">
                      <CircleAlertIcon size={14} className="inline mr-1" aria-hidden="true" />
                      La experiencia profesional no debe superar los {MAX_EXPERIENCIA} caracteres.
                    </p>
                  )}
                </div>

                {/* Campo Información relevante para la mentoría */}
                <div className="mentor-info-field">
                  <div className="mentor-info-field-top">
                    <label htmlFor="field-relevante" className="mentor-info-label">
                      Información relevante para la mentoría
                      <span className="mentor-info-optional">(opcional)</span>
                    </label>
                    <span
                      className={`mentor-info-counter ${relevanteExceeded ? 'is-limit' : ''}`}
                    >
                      {informacionRelevante.length} / {MAX_RELEVANTE}
                    </span>
                  </div>
                  <p className="mentor-info-hint">
                    Enfoque, temas o forma de trabajo que consideres de valor para quienes buscan orientación.
                  </p>
                  <textarea
                    id="field-relevante"
                    rows={4}
                    value={informacionRelevante}
                    onChange={e => setInformacionRelevante(e.target.value)}
                    placeholder="Ej. Enfoque práctico en preparación para entrevistas técnicas..."
                    className={`mentor-info-textarea ${relevanteExceeded ? 'has-error' : ''}`}
                  />
                  {relevanteExceeded && (
                    <p role="alert" className="mentor-info-field-error">
                      <CircleAlertIcon size={14} className="inline mr-1" aria-hidden="true" />
                      Este campo no debe superar los {MAX_RELEVANTE} caracteres.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer de formulario */}
              <div className="mentor-info-footer">
                <button
                  type="button"
                  className="mentor-button mentor-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>

                <div className="mentor-info-footer-right">
                  {isDirty && (
                    <div className="mentor-info-dirty-badge">
                      <span className="mentor-info-dirty-dot" aria-hidden="true" />
                      <span>Cambios sin guardar</span>
                    </div>
                  )}

                  <PrimaryButton
                    type="submit"
                    loading={saving}
                    loadingLabel="Guardando…"
                    disabled={isOverLimit || saving}
                    iconRight={SaveIcon}
                  >
                    Guardar información
                  </PrimaryButton>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Enlace Volver a mi perfil fuera de la tarjeta */}
        {!isEditing && (
          <div className="mentor-info-bottom-back-wrapper">
            <Link href="/mentorship/profile" className="mentor-info-bottom-back">
              <ArrowLeftIcon size={16} aria-hidden="true" />
              <span>Volver a mi perfil</span>
            </Link>
          </div>
        )}

        {/* Modal de confirmación para eliminar información */}
        <ConfirmModal
          open={showDeleteModal}
          eyebrow="Información del perfil"
          title="¿Eliminar información del perfil?"
          description={
            <div className="space-y-2">
              <p>Se eliminarán tu descripción, experiencia e información para la mentoría.</p>
              <p className="text-[#1B2632]/80">
                Dejarán de mostrarse en el directorio de titulados. Tu participación, áreas, intereses y disponibilidad no cambian.
              </p>
            </div>
          }
          icon={Trash2Icon}
          cancelLabel="Cancelar"
          confirmLabel="Eliminar"
          confirming={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => void handleConfirmDelete()}
        />
      </PageLayout>
    </main>
  );
}

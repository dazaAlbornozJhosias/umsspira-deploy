'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '@/shared/components/button';
import { maskEmail } from '@/shared/utils/mask-email';
import { StepNotice } from '@/modules/documents/frontend/components/step-notice';
import { DOCUMENT_TYPE_OPTIONS, submitRegistration } from '@/modules/documents/frontend/services';
import { useRegistrationStore, type PersonalData } from '../store';
import { fetchCareers, updateRegistrationSession, type Career } from '../services';
import { EXPEDITION_LABELS } from '../validation/personal-data.schema';
import { useEmailVerificationStore } from '@/modules/email-verification/frontend/store';
import { ReviewField, ReviewSection, ReviewHeader, ReviewDeclaration } from './review-summary-section';
import { ReviewDocumentPreview } from './review-document-preview';
import { RegistrationEditForm, type RegistrationEditVariant } from './registration-edit-form';

export const REVIEW_PATH = '/register/review';
export const PREVIOUS_STEP_PATH = '/register/document';
export const REGISTER_PATH = '/register';
export const CONFIRMATION_PATH = '/register/confirmation';
export const VERIFY_EMAIL_PATH = '/register/verify-email';

const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

/**
 * Pantalla de resumen previa a la entrega definitiva (HU-07, CA-07.1 y CA-07.2).
 * No registra la solicitud: solo muestra los datos, el documento y las acciones de
 * correccion. La entrega se confirma en esta misma pantalla (CA-07.5).
 */
export function RegistrationReview() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [careers, setCareers] = useState<Career[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<RegistrationEditVariant | null>(null);

  const sessionToken = useRegistrationStore((state) => state.sessionToken);
  const personalData = useRegistrationStore((state) => state.personalData);
  const document = useRegistrationStore((state) => state.document);
  const verifiedEmail = useRegistrationStore((state) => state.verifiedEmail);
  const setPersonalData = useRegistrationStore((state) => state.setPersonalData);
  const setConfirmation = useRegistrationStore((state) => state.setConfirmation);

  useEffect(() => {
    setIsMounted(true);
    fetchCareers()
      .then(setCareers)
      .catch(() => setCareers([]));
  }, []);

  if (!isMounted) return null;

  if (!sessionToken || !personalData) {
    return (
      <StepNotice
        message="Primero completa tus datos personales para revisar tu solicitud."
        actionLabel="Completar mis datos"
        onAction={() => router.push(REGISTER_PATH)}
      />
    );
  }

  if (!document) {
    return (
      <StepNotice
        message="Aún no adjuntaste tu documento de respaldo. Cárgalo para continuar con el resumen."
        actionLabel="Cargar documento"
        onAction={() => router.push(PREVIOUS_STEP_PATH)}
      />
    );
  }

  const careerName =
    careers.find((career) => career.id === personalData.carreraId)?.nombre ?? 'Carrera registrada';
  const isEmailVerified = verifiedEmail === personalData.correo;
  const hasPendingEmailChange = Boolean(verifiedEmail) && !isEmailVerified;
  const idNumber = [personalData.ci, personalData.complementoCi].filter(Boolean).join(' ');

  // CA-07.3: los cambios se aplican en la misma pantalla y conservan el resto del resumen.
  async function saveSection(values: PersonalData) {
    if (!sessionToken || isSaving) return;
    setIsSaving(true);
    setError(null);
    const result = await updateRegistrationSession(sessionToken, { ...values });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPersonalData(values);
    useRegistrationStore.getState().setVerifiedEmail(result.verifiedEmail);
    setEditing(null);
    if (values.correo !== result.verifiedEmail) {
      useEmailVerificationStore.getState().setEmail(values.correo);
      router.push(`${VERIFY_EMAIL_PATH}?mode=update`);
    }
  }

  async function cancelEmailChange() {
    if (!personalData || !verifiedEmail) return;
    await saveSection({ ...personalData, correo: verifiedEmail });
  }

  async function handleSubmit() {
    if (!personalData || !document || !sessionToken || editing || isSaving || isSubmitting) return;
    if (!isEmailVerified) {
      setError('Debes verificar tu correo electrónico antes de entregar la solicitud.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const saved = await updateRegistrationSession(sessionToken, { ...personalData });
    if (!saved.ok || saved.verifiedEmail !== personalData.correo) {
      setIsSubmitting(false);
      if (saved.ok) useRegistrationStore.getState().setVerifiedEmail(saved.verifiedEmail);
      setError(saved.ok ? 'Verifica tu correo electrónico antes de entregar la solicitud.' : saved.message);
      return;
    }
    const result = await submitRegistration({
      sessionToken,
      tipoDocumento: document.tipoDocumento,
      rutaStorage: document.path,
      sizeBytes: document.sizeBytes,
      mimeType: document.mimeType,
    });

    if (result.ok) {
      setConfirmation({
        estado: result.submission.estado,
        fechaEnvio: new Date().toISOString(),
        nombreCompleto: `${personalData.nombres} ${personalData.apellidos}`.trim(),
        ci: idNumber,
        correoEnmascarado: maskEmail(personalData.correo),
        correo: personalData.correo,
        plazoHoras: 48,
        tipoDocumento: document.tipoDocumento,
        nombreArchivo: document.originalName,
      });
      router.push(CONFIRMATION_PATH);
      return;
    }

    setIsSubmitting(false);
    setError(result.message);
  }

  return (
    <div className="space-y-4">
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-fantastic px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Resumen final <span aria-hidden="true">•</span>
      </span>

      <section className="rounded-2xl border border-oatmeal bg-white p-5 shadow-sm sm:p-8">
        <ReviewHeader />

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble"
          >
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <ReviewSection
            icon={UserRound}
            title="1. Datos Personales"
            actionLabel="Editar datos"
            showAction={!editing && !isSaving && !isSubmitting}
            onAction={() => setEditing('personal')}
          >
            {editing === 'personal' ? (
              <RegistrationEditForm
                variant="personal"
                personalData={personalData}
                careers={careers}
                isSaving={isSaving}
                onSave={saveSection}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <dl className="grid gap-3 sm:grid-cols-3">
                <ReviewField label="Nombres">{personalData.nombres}</ReviewField>
                <ReviewField label="Apellidos">{personalData.apellidos}</ReviewField>
                <ReviewField label="Cédula de Identidad (C.I.)">{personalData.ci}</ReviewField>
                <ReviewField label="Complemento">
                  {personalData.complementoCi || 'Sin complemento'}
                </ReviewField>
                <ReviewField label="Expedido en">
                  {EXPEDITION_LABELS[personalData.expedidoEn as keyof typeof EXPEDITION_LABELS] ??
                    personalData.expedidoEn}
                </ReviewField>
              </dl>
            )}
          </ReviewSection>

          <ReviewSection
            icon={Mail}
            title="2. Contacto e Información Académica"
            actionLabel="Editar datos"
            showAction={!editing && !isSaving && !isSubmitting}
            onAction={() => setEditing('contact')}
          >
            {editing === 'contact' ? (
              <RegistrationEditForm
                variant="contact"
                personalData={personalData}
                careers={careers}
                isSaving={isSaving}
                onSave={saveSection}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <ReviewField label="Correo electrónico">
                  <span className="flex flex-wrap items-center gap-2">
                    {personalData.correo}
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-fantastic px-2 py-0.5 text-[10px] font-semibold text-white">
                        <ShieldCheck aria-hidden="true" className="h-3 w-3 text-burning-flame" />
                        Verificado
                      </span>
                    ) : (
                      <span className="rounded bg-truffle-trouble/15 px-2 py-0.5 text-[10px] font-semibold text-truffle-trouble">
                        Pendiente de verificación
                      </span>
                    )}
                  </span>
                </ReviewField>
                <ReviewField label="Teléfono / WhatsApp">+591 {personalData.telefono}</ReviewField>
                <ReviewField label="Carrera / Programa académico">{careerName}</ReviewField>
                <ReviewField label="Año de egreso / conclusión">{personalData.anioEgreso}</ReviewField>
                <ReviewField label="Código SIS universitario">{personalData.codigoSis}</ReviewField>
              </dl>
            )}

            {hasPendingEmailChange && editing !== 'contact' && (
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-truffle-trouble/30 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-abyssal-blue/80">
                  Cambiaste tu correo. Verifica la nueva dirección para habilitar la entrega.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={() => router.push(`${VERIFY_EMAIL_PATH}?mode=update`)}
                  >
                    Verificar nuevo correo
                  </Button>
                  <button
                    type="button"
                    disabled={isSaving || isSubmitting}
                    onClick={cancelEmailChange}
                    className="text-xs font-semibold text-truffle-trouble underline-offset-2 hover:underline"
                  >
                    Usar el correo anterior
                  </button>
                </div>
              </div>
            )}
          </ReviewSection>

          <ReviewSection
            icon={FolderOpen}
            title="3. Documento de Respaldo"
            showAction={!isSaving && !isSubmitting && !editing}
            actionLabel="Cambiar documento"
            onAction={() => router.push(PREVIOUS_STEP_PATH)}
          >
            <dl className="grid gap-3 sm:grid-cols-3">
              <ReviewField label="Tipo de documento">
                {DOCUMENT_TYPE_LABELS[document.tipoDocumento] ?? document.tipoDocumento}
              </ReviewField>
              <ReviewField label="Nombre del archivo">{document.originalName}</ReviewField>
              <ReviewField label="Integridad digital">
                {(document.sizeBytes / (1024 * 1024)).toFixed(1)} MB · Documento validado
              </ReviewField>
            </dl>
            <div className="mt-3">
              <ReviewDocumentPreview document={document} />
            </div>
          </ReviewSection>

          <ReviewDeclaration />
        </div>

        {!isEmailVerified && (
          <p className="mt-4 text-xs font-medium text-truffle-trouble">
            Debes verificar tu correo electrónico para habilitar la entrega de la solicitud.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-oatmeal/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center justify-center gap-2"
            onClick={() => router.push(PREVIOUS_STEP_PATH)}
            disabled={isSubmitting || isSaving}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Volver al paso previo
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isEmailVerified || isSubmitting || isSaving || Boolean(editing)}
            className="bg-burning-flame text-abyssal-blue hover:bg-burning-flame/90 hover:text-abyssal-blue disabled:hover:bg-burning-flame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-abyssal-blue focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 px-6 text-sm font-bold"
          >
            {isSubmitting ? 'Enviando solicitud...' : 'Entregar solicitud'}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-abyssal-blue/60">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Protegido por el Sistema Institucional UMSSPIRA bajo el Protocolo Criptográfico de Certificación
          Universitaria.
        </p>
      </section>
    </div>
  );
}

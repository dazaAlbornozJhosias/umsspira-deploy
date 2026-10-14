'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { FormSelect } from '@/modules/registration/frontend/components/form-select';
import { useRegistrationStore } from '@/modules/registration/frontend/store';
import { useDocumentUpload } from '../hooks/use-document-upload';
import {
  DOCUMENT_TYPE_OPTIONS,
  submitRegistration,
  type DocumentType,
  type SubmittedRegistration,
  type UploadedDocument,
} from '../services';
import { useEmailVerificationStore } from '@/modules/email-verification/frontend/store';
import { DOCUMENT_ERROR_MESSAGES } from '../validation/document-file';
import { DocumentFilePicker } from './document-file-picker';
import { DocumentPreview } from './document-preview';
import { StepNotice } from './step-notice';
import { SubmissionSuccessModal } from './submission-success-modal';
import { SWORN_DECLARATION_ERROR, SwornDeclaration } from './sworn-declaration';

export const REGISTER_PATH = '/register';
export const VERIFY_EMAIL_PATH = '/register/verify-email';

type BlockingNotice = { message: string; actionLabel: string; actionPath: string };

/** Paso "Documento" del registro publico (HU-03): tipo, archivo, vista previa y envio. */
export function DocumentUploadStep() {
  const router = useRouter();
  const resetRegistration = useRegistrationStore((state) => state.reset);

  // El token se lee despues de montar para no diferir del HTML generado en el servidor.
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);
  const [tipoDocumento, setTipoDocumento] = useState<DocumentType | ''>('');
  const [typeError, setTypeError] = useState<string | null>(null);
  const [isDeclared, setIsDeclared] = useState(false);
  const [declarationError, setDeclarationError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [blockingNotice, setBlockingNotice] = useState<BlockingNotice | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    registration: SubmittedRegistration;
    submittedAt: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const personalData = useRegistrationStore((state) => state.personalData);

  const { file, previewUrl, previewKind, fileError, setFileError, isUploading, selectFile, upload } =
    useDocumentUpload();
  const isLocked = isUploading || isSubmitting || !!submitted;
  const isSending = isUploading || isSubmitting;

  useEffect(() => {
    setSessionToken(useRegistrationStore.getState().sessionToken);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);

    // CA-03.5: no se envia sin tipo de documento ni archivo; tambien se exige la declaracion jurada.
    setTypeError(tipoDocumento ? null : DOCUMENT_ERROR_MESSAGES.missingType);
    if (!file) setFileError(DOCUMENT_ERROR_MESSAGES.missingFile);
    setDeclarationError(isDeclared ? null : SWORN_DECLARATION_ERROR);
    if (!tipoDocumento || !file || !isDeclared || !sessionToken) return;

    const result = await upload(sessionToken, tipoDocumento);
    if (!result) return;
    if (result.ok) {
      setUploadedDocument(result.document);
      await submitAfterUpload(sessionToken, tipoDocumento, result.document);
      return;
    }

    if (result.status === 403 && result.code === 'EMAIL_NOT_VERIFIED') {
      // CA-03.1: el correo debe verificarse antes de adjuntar el documento.
      setBlockingNotice({ message: result.message, actionLabel: 'Verificar mi correo', actionPath: VERIFY_EMAIL_PATH });
      return;
    }
    if (result.status === 410) {
      resetRegistration();
      setBlockingNotice({ message: result.message, actionLabel: 'Volver al formulario', actionPath: REGISTER_PATH });
      return;
    }

    const archivoError = result.errors.find((error) => error.field === 'archivo');
    const tipoError = result.errors.find((error) => error.field === 'tipoDocumento');
    if (archivoError) setFileError(archivoError.message);
    if (tipoError) setTypeError(tipoError.message);
    if (!archivoError && !tipoError) setGeneralError(result.message);
  }

  // CA-03.2: con el documento ya guardado, registra la solicitud y muestra la confirmación.
  async function submitAfterUpload(
    sessionToken: string,
    tipoDocumento: DocumentType,
    document: UploadedDocument,
  ) {
    setIsSubmitting(true);
    try {
      const result = await submitRegistration({
        sessionToken,
        tipoDocumento,
        rutaStorage: document.path,
        sizeBytes: document.sizeBytes,
        mimeType: document.mimeType,
      });
      if (result.ok) {
        setSubmitted({ registration: result.submission, submittedAt: new Date().toISOString() });
        setIsModalOpen(true);
        return;
      }
      if (result.status === 410) {
        resetRegistration();
        setBlockingNotice({ message: result.message, actionLabel: 'Volver al formulario', actionPath: REGISTER_PATH });
        return;
      }
      if (result.status === 400 && result.message.includes('verificar tu correo')) {
        setBlockingNotice({ message: result.message, actionLabel: 'Verificar mi correo', actionPath: VERIFY_EMAIL_PATH });
        return;
      }
      setGeneralError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function goHome() {
    resetRegistration();
    useEmailVerificationStore.getState().reset();
    router.push('/');
  }

  if (sessionToken === undefined) return null;

  if (!sessionToken) {
    return (
      <StepNotice
        message="Primero completa tus datos personales para iniciar tu solicitud."
        actionLabel="Completar mis datos"
        onAction={() => router.push(REGISTER_PATH)}
      />
    );
  }

  if (blockingNotice) {
    return (
      <StepNotice
        message={blockingNotice.message}
        actionLabel={blockingNotice.actionLabel}
        onAction={() => router.push(blockingNotice.actionPath)}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-oatmeal bg-palladian/60 p-6 shadow-sm sm:p-10">
      <header className="border-b border-oatmeal pb-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-abyssal-blue/70">
          <FolderOpen aria-hidden="true" className="h-5 w-5 text-burning-flame" />
          Trámite de acreditación
        </p>
        <h1 className="mt-3 text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
          Carga de documento de respaldo
        </h1>
        <p className="mt-2 text-sm text-abyssal-blue/70 sm:text-lg sm:leading-[26px]">
          Adjunta el documento digital escaneado que acredite tu condición de titulado universitario (PDF, PNG o
          JPG, máx. 5 MB).
        </p>
      </header>

      {submitted && !isModalOpen && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-blue-fantastic/30 bg-white p-4 text-sm text-blue-fantastic sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="font-medium">
            Tu solicitud fue registrada correctamente.
          </p>
          <Button type="button" onClick={goHome}>
            Ir al inicio
          </Button>
        </div>
      )}
      {generalError && (
        <div role="alert" className="mt-6 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
        <div className="space-y-1.5">
          <FormSelect
            name="tipoDocumento"
            label="Tipo de documento"
            required
            placeholder="Elige una opción"
            options={DOCUMENT_TYPE_OPTIONS}
            value={tipoDocumento}
            error={typeError ?? undefined}
            disabled={isLocked}
            className="bg-white"
            onChange={(event) => {
              setTipoDocumento(event.target.value as DocumentType | '');
              setTypeError(null);
            }}
          />
          {!typeError && (
            <p className="text-xs text-abyssal-blue/70">Selecciona la denominación exacta de tu titulación expedida.</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-abyssal-blue sm:text-sm">
              Adjunto digital respaldatorio<span className="text-truffle-trouble"> *</span>
            </span>
            <span className="text-xs text-abyssal-blue/70">Solo un archivo oficial</span>
          </div>
          <DocumentFilePicker onSelect={selectFile} hasError={!!fileError && !file} disabled={isLocked} />
          {fileError && (
            <p role="alert" className="text-[11px] font-medium text-truffle-trouble">
              {fileError}
            </p>
          )}
          {file && previewUrl && previewKind && (
            <DocumentPreview file={file} previewUrl={previewUrl} previewKind={previewKind} onReplace={selectFile} disabled={isLocked} />
          )}
        </div>

        <SwornDeclaration
          checked={isDeclared}
          error={declarationError}
          disabled={isLocked}
          onChange={(checked) => {
            setIsDeclared(checked);
            if (checked) setDeclarationError(null);
          }}
        />

        <div className="border-t border-oatmeal pt-6">
          <Button type="submit" disabled={isLocked} className="inline-flex h-12 items-center gap-2 bg-burning-flame px-8 text-base font-bold text-abyssal-blue hover:bg-burning-flame/90">
            {isSending ? 'Enviando...' : 'Finalizar y enviar solicitud'}
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {isModalOpen && submitted && uploadedDocument && (
        <SubmissionSuccessModal
          submission={submitted.registration}
          submittedAt={submitted.submittedAt}
          documentType={tipoDocumento as DocumentType}
          fullName={`${personalData?.nombres ?? ''} ${personalData?.apellidos ?? ''}`.trim()}
          idNumber={[personalData?.ci, personalData?.complementoCi].filter(Boolean).join(' ')}
          email={personalData?.correo ?? ''}
          fileName={uploadedDocument.originalName}
          fileSizeBytes={uploadedDocument.sizeBytes}
          onGoHome={goHome}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}

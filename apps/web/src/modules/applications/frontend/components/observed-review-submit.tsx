'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FolderOpen, Mail, UserRound } from 'lucide-react';
import { Button } from '@/shared/components/button';
import {
  ReviewDeclaration,
  ReviewField,
  ReviewHeader,
  ReviewSection,
} from '@/modules/registration/frontend/components/review-summary-section';
import { EXPEDITION_LABELS } from '@/modules/registration/frontend/validation/personal-data.schema';
import type { CorrectionResult, CorrectionValues } from '../hooks/use-observed-correction';
import {
  resubmitObservedApplication,
  type ResubmitProgress,
} from '../services/application.service';

type Props = {
  token: string;
  version: number;
  result: CorrectionResult;
  currentDocument: { name: string };
  onBack: () => void;
};

type Phase =
  | { name: 'idle' }
  | { name: 'sending' }
  | { name: 'success' }
  | { name: 'conflict' }
  | { name: 'email-verification' }
  | { name: 'blocked'; reason: 'invalid-link' | 'expired' }
  | { name: 'error'; message: string };

const BLOCKED_MESSAGES = {
  'invalid-link': 'Este enlace ya no es válido. No es posible entregar la corrección.',
  expired: 'Este enlace venció. Solicita uno nuevo para entregar tu corrección.',
} as const;

const alertClass =
  'mt-5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble';

export function ObservedReviewSubmit({ token, version, result, currentDocument, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  // Conserva la versión y los pasos ya guardados para reintentar sin repetirlos (CA-10.5).
  const progress = useRef<ResubmitProgress>({ version, dataSaved: false, documentSaved: false });
  const { values, changedFields, file, emailChanged } = result;
  const changed = (k: keyof CorrectionValues) => changedFields.includes(k);
  const sending = phase.name === 'sending';

  async function handleSubmit() {
    if (sending || emailChanged) return;
    setPhase({ name: 'sending' });
    const outcome = await resubmitObservedApplication(token, result, progress.current);
    if (outcome.status === 'success') setPhase({ name: 'success' });
    else if (outcome.status === 'conflict') setPhase({ name: 'conflict' });
    else if (outcome.status === 'email-verification') setPhase({ name: 'email-verification' });
    else if (outcome.status === 'invalid-link' || outcome.status === 'expired') {
      setPhase({ name: 'blocked', reason: outcome.status });
    } else setPhase({ name: 'error', message: outcome.message });
  }

  if (phase.name === 'success') {
    return (
      <section
        role="status"
        className="rounded-2xl border border-oatmeal bg-white p-8 text-center shadow-sm"
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-emerald-600" />
        <h1 className="mt-3 text-2xl font-bold text-abyssal-blue">Corrección entregada</h1>
        <p className="mt-2 text-sm text-abyssal-blue/80">
          Tu solicitud volvió al estado Pendiente. Es el mismo expediente: no se creó un trámite
          nuevo.
        </p>
      </section>
    );
  }

  if (phase.name === 'blocked') {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-oatmeal bg-white p-8 text-center shadow-sm"
      >
        <p className="text-sm text-abyssal-blue">{BLOCKED_MESSAGES[phase.reason]}</p>
      </div>
    );
  }

  const mark = (k: keyof CorrectionValues, text: string) => (
    <>
      {text || '—'}
      {changed(k) && (
        <span className="ml-2 rounded bg-burning-flame/30 px-1.5 py-0.5 text-[10px] font-bold">
          Modificado
        </span>
      )}
    </>
  );

  return (
    <section className="rounded-2xl border border-oatmeal bg-white p-5 shadow-sm sm:p-8">
      <ReviewHeader />

      {phase.name === 'error' && (
        <div role="alert" className={alertClass}>
          {phase.message}
        </div>
      )}
      {phase.name === 'conflict' && (
        <div role="alert" className={alertClass}>
          La solicitud cambió; actualiza antes de guardar
          <button type="button" className="ml-3 underline" onClick={() => window.location.reload()}>
            Actualizar
          </button>
        </div>
      )}
      {phase.name === 'email-verification' && (
        <div role="alert" className={alertClass}>
          Guardamos tus datos, pero debes verificar tu nuevo correo antes de entregar la solicitud.
        </div>
      )}

      <div className="mt-6 space-y-4">
        <ReviewSection
          icon={UserRound}
          title="1. Datos Personales"
          actionLabel=""
          showAction={false}
          onAction={() => {}}
        >
          <dl className="grid gap-3 sm:grid-cols-3">
            <ReviewField label="Nombres">{mark('firstName', values.firstName)}</ReviewField>
            <ReviewField label="Apellidos">{mark('lastName', values.lastName)}</ReviewField>
            <ReviewField label="Fecha de nacimiento">
              {mark('birthDate', values.birthDate)}
            </ReviewField>
            <ReviewField label="Cédula de Identidad (C.I.)">{mark('ci', values.ci)}</ReviewField>
            <ReviewField label="Complemento">{mark('complement', values.complement)}</ReviewField>
            <ReviewField label="Expedido en">
              {mark(
                'issuedIn',
                EXPEDITION_LABELS[values.issuedIn as keyof typeof EXPEDITION_LABELS] ??
                  values.issuedIn,
              )}
            </ReviewField>
          </dl>
        </ReviewSection>

        <ReviewSection
          icon={Mail}
          title="2. Contacto e Información Académica"
          actionLabel=""
          showAction={false}
          onAction={() => {}}
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <ReviewField label="Correo electrónico">{mark('email', values.email)}</ReviewField>
            <ReviewField label="Teléfono / WhatsApp">{mark('phone', values.phone)}</ReviewField>
            <ReviewField label="Carrera / Programa académico">
              {mark('career', values.career)}
            </ReviewField>
            <ReviewField label="Año de egreso / conclusión">
              {mark('graduationYear', values.graduationYear)}
            </ReviewField>
            <ReviewField label="Código SIS universitario">
              {mark('sisCode', values.sisCode)}
            </ReviewField>
          </dl>
        </ReviewSection>

        <ReviewSection
          icon={FolderOpen}
          title="3. Documento de Respaldo"
          actionLabel=""
          showAction={false}
          onAction={() => {}}
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <ReviewField label="Tipo de documento">
              {mark('documentType', values.documentType)}
            </ReviewField>
            <ReviewField label="Nombre del archivo">
              {file ? file.name : currentDocument.name}
              {file && (
                <span className="ml-2 rounded bg-burning-flame/30 px-1.5 py-0.5 text-[10px] font-bold">
                  Reemplazado
                </span>
              )}
            </ReviewField>
          </dl>
        </ReviewSection>

        <ReviewDeclaration />
      </div>

      {emailChanged && (
        <p className="mt-4 text-xs font-medium text-truffle-trouble">
          Debes verificar tu nuevo correo electrónico para habilitar la entrega.
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-oatmeal/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="inline-flex items-center justify-center gap-2"
          onClick={onBack}
          disabled={sending}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Volver a editar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={sending || emailChanged}
          className="bg-burning-flame text-abyssal-blue hover:bg-burning-flame/90 inline-flex items-center justify-center gap-2 px-6 text-sm font-bold"
        >
          {sending ? 'Entregando...' : phase.name === 'error' ? 'Reintentar' : 'Entregar solicitud'}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
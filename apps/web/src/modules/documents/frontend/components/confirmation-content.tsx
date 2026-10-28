'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Mail, ShieldCheck } from 'lucide-react';
import { useRegistrationStore, type RegistrationDocumentType } from '@/modules/registration/frontend/store';
import {
  SubmissionConfirmation,
  type SubmittedDocumentType,
} from './submission-confirmation';

const DOCUMENT_TYPE_MAP: Record<RegistrationDocumentType, SubmittedDocumentType> = {
  titulo_provision_nacional: 'national-title',
  diploma_academico: 'academic-diploma',
  certificado_egreso: 'graduation-certificate',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  OBSERVED: 'Observado',
  REJECTED: 'Rechazado',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobado',
  OBSERVADA: 'Observado',
  RECHAZADA: 'Rechazado',
};

/**
 * Confirmacion publica de la entrega (CA-07.6). Muestra solo datos del titulado:
 * el codigo interno TIT y la etiqueta N/A quedan reservados a la bandeja administrativa.
 */
export function ConfirmationContent() {
  const [isMounted, setIsMounted] = useState(false);
  const confirmation = useRegistrationStore((state) => state.confirmation);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!confirmation) {
    return (
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-oatmeal bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-abyssal-blue">No encontramos una solicitud reciente</h1>
        <p className="mt-2 text-sm text-abyssal-blue/70">
          Si acabas de entregar tu solicitud, vuelve a iniciar el proceso o revisa tu correo electrónico.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-burning-flame px-6 text-sm font-bold text-abyssal-blue"
        >
          Volver al inicio
        </Link>
      </section>
    );
  }

  const documentType = DOCUMENT_TYPE_MAP[confirmation.tipoDocumento ?? 'titulo_provision_nacional'];
  const status = STATUS_LABEL[confirmation.estado] ?? confirmation.estado;

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl border border-oatmeal bg-white p-6 shadow-sm sm:p-8">
      <header className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-burning-flame/30">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-burning-flame">
            <Check aria-hidden="true" className="h-7 w-7 text-abyssal-blue" strokeWidth={3} />
          </span>
        </span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-abyssal-blue/60">
          Trámite registrado oficialmente
        </p>
        <h1 className="mt-1 text-2xl font-bold text-abyssal-blue sm:text-3xl">¡Solicitud enviada con éxito!</h1>
        <p className="mt-2 text-sm text-abyssal-blue/70">
          Tu solicitud fue registrada correctamente y será revisada por el equipo administrativo.
        </p>
      </header>

      <div className="mt-6">
        <SubmissionConfirmation
          submittedAt={confirmation.fechaEnvio}
          documentType={documentType}
          fullName={confirmation.nombreCompleto}
          idNumber={confirmation.ci}
          email={confirmation.correo ?? confirmation.correoEnmascarado}
          fileName={confirmation.nombreArchivo}
          status={status}
          responseDeadlineHours={confirmation.plazoHoras}
        />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-oatmeal bg-palladian/50 p-4">
        <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-truffle-trouble" />
        <p className="text-xs leading-relaxed text-abyssal-blue/80">
          <strong className="font-semibold text-abyssal-blue">Notificación automática:</strong> recibirás el
          resultado de tu solicitud y el dictamen de verificación directamente en tu correo electrónico.
        </p>
      </div>

      <Link
        href="/"
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-burning-flame px-6 text-sm font-bold text-abyssal-blue transition hover:bg-burning-flame/90"
      >
        Volver al inicio
      </Link>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-abyssal-blue/60">
        <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
        Protegido por el Sistema Institucional UMSSPIRA bajo el Protocolo Criptográfico de Certificación
        Universitaria.
      </p>
    </section>
  );
}

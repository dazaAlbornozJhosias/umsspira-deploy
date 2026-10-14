'use client';

import { Camera, Check, FileText } from 'lucide-react';
import Link from 'next/link';

import { SAMPLE_BACKUP_URL } from '@/modules/profile/utils/backup-url';

// Campos de la v3 del Figma: fondo crema, borde arena y esquinas de 8px
export const INPUT_CLASS =
  'w-full rounded-lg border border-oatmeal bg-[#FFFCF7] px-3.5 py-[13px] text-sm text-blue-fantastic outline-none transition focus:border-truffle-trouble disabled:cursor-not-allowed disabled:opacity-50';

type EditRecordLayoutProps = {
  title: string;
  description: string;
  number: string;
  sectionTitle: string;
  sectionSubtitle: string;
  isSaved: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  children: React.ReactNode;
};

// Estructura común de las pantallas de edición (v3 "Editar certificación"): introducción, tarjeta y acciones
export function EditRecordLayout({
  title,
  description,
  number,
  sectionTitle,
  sectionSubtitle,
  isSaved,
  onSubmit,
  onCancel,
  children,
}: EditRecordLayoutProps) {
  return (
    <div className="flex flex-col gap-[26px] md:py-4">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase text-truffle-trouble">Perfil profesional</p>
        <h1 className="text-[22px] font-bold text-abyssal-blue md:text-[28px]">{title}</h1>
        <p className="text-sm text-[#6D716F]">{description}</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl bg-[#FFFCF7] p-4 md:p-6">
        {/* Encabezado de sección */}
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-fantastic text-[13px] font-bold text-white">
            {number}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h2 className="text-base font-bold text-abyssal-blue md:text-lg">{sectionTitle}</h2>
            <p className="text-xs text-[#6D716F]">{sectionSubtitle}</p>
          </div>
          {isSaved && (
            <span
              role="status"
              className="flex items-center gap-1 rounded-full bg-truffle-trouble px-2.5 py-[5px] text-[11px] font-bold text-white"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              Guardado
            </span>
          )}
        </div>

        {children}

        {/* Acciones */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            className="rounded-lg bg-burning-flame px-7 py-3.5 text-[15px] font-semibold text-abyssal-blue transition hover:brightness-95"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-oatmeal bg-white px-7 py-3.5 text-[15px] font-semibold text-blue-fantastic transition hover:bg-palladian"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function FormField({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-blue-fantastic">
        {label}
      </label>
      {children}
    </div>
  );
}

type BackupFieldProps = {
  documentName: string;
  isVerified: boolean;
  onDocumentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

// Respaldo documental con estado, enlace al archivo y botones para subir foto o documento
export function BackupField({ documentName, isVerified, onDocumentChange }: BackupFieldProps) {
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[13px] font-semibold text-blue-fantastic">Respaldo documental</span>

      {documentName && (
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isVerified ? 'bg-[#2C7A4D] text-white' : 'bg-[#FFF3CD] text-[#664D03]'
            }`}
          >
            {isVerified ? 'Respaldo verificado' : 'Respaldo en revisión'}
          </span>
          <a
            href={SAMPLE_BACKUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-truffle-trouble underline"
          >
            {documentName}
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-oatmeal bg-palladian p-5">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-oatmeal bg-white px-4 py-2.5 text-[13px] font-semibold text-blue-fantastic transition hover:bg-palladian">
          <Camera className="h-4 w-4" aria-hidden="true" />
          Subir foto
          <input type="file" accept="image/jpeg" className="hidden" onChange={onDocumentChange} />
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md bg-abyssal-blue px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Subir documento
          <input type="file" accept="image/jpeg" className="hidden" onChange={onDocumentChange} />
        </label>
      </div>
    </div>
  );
}

export function RecordNotFound({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-abyssal-blue/10 bg-white p-6">
      <h1 className="text-xl font-bold text-blue-fantastic">No encontramos esta {label}</h1>
      <p className="text-sm text-blue-fantastic/70">Puede que haya sido eliminada. Vuelve a tus registros para elegir otra.</p>
      <Link
        href="/profile/records"
        className="rounded-lg border border-oatmeal bg-white px-5 py-2.5 text-sm font-semibold text-blue-fantastic transition hover:bg-palladian"
      >
        Volver a mis registros
      </Link>
    </div>
  );
}

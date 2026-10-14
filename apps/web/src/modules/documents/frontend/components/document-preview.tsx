'use client';

import { useRef, type ChangeEvent } from 'react';
import { BadgeCheck, FileText, ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { ACCEPTED_DOCUMENT_TYPES, formatFileSize, type PreviewKind } from '../validation/document-file';

export interface DocumentPreviewProps {
  file: File;
  previewUrl: string;
  previewKind: PreviewKind;
  onReplace: (file: File) => void;
  disabled?: boolean;
}

/**
 * Tarjeta del documento adjunto con su vista previa local y el boton "Reemplazar archivo" (CA-03.4).
 * El archivo no se sube al servidor hasta que el titulado finaliza la solicitud.
 */
export function DocumentPreview({ file, previewUrl, previewKind, onReplace, disabled }: DocumentPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = previewKind === 'pdf' ? FileText : ImageIcon;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) onReplace(nextFile);
    // Permite volver a elegir el mismo archivo despues de un rechazo.
    event.target.value = '';
  }

  return (
    <div className="overflow-hidden rounded-xl border border-oatmeal bg-white">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-truffle-trouble/30 bg-truffle-trouble/10">
            <Icon aria-hidden="true" className="h-7 w-7 text-truffle-trouble" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-abyssal-blue sm:text-base" title={file.name}>
                {file.name}
              </p>
              <span className="inline-flex items-center gap-1 rounded-md bg-abyssal-blue px-2 py-0.5 text-[11px] font-semibold text-white">
                <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 text-burning-flame" />
                Documento cargado correctamente
              </span>
            </div>
            <p className="mt-1 text-xs text-abyssal-blue/70 sm:text-[13px]">
              {formatFileSize(file.size)} · {previewKind === 'pdf' ? 'Documento PDF' : 'Imagen'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-white"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Reemplazar archivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_TYPES}
          className="hidden"
          data-testid="replace-document-input"
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-center border-t border-oatmeal/60 bg-palladian/40 p-4">
        {previewKind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local de un archivo del usuario (blob:)
          <img
            src={previewUrl}
            alt={`Vista previa de ${file.name}`}
            className="max-h-[420px] w-auto rounded-md object-contain shadow-sm"
          />
        ) : (
          <object
            data={previewUrl}
            type="application/pdf"
            aria-label={`Vista previa de ${file.name}`}
            className="h-[420px] w-full rounded-md bg-white"
          >
            <p className="p-4 text-center text-sm text-abyssal-blue">
              Tu navegador no puede mostrar el PDF aquí.{' '}
              <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold text-truffle-trouble underline">
                Abrir vista previa
              </a>
            </p>
          </object>
        )}
      </div>
    </div>
  );
}

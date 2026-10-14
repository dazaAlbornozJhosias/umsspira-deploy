'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { ACCEPTED_DOCUMENT_TYPES } from '../validation/document-file';

export interface DocumentFilePickerProps {
  onSelect: (file: File) => void;
  hasError?: boolean;
  disabled?: boolean;
}

/**
 * Zona para elegir o arrastrar el documento.
 * Temporal: se reemplaza por DocumentDropzone cuando se integre la tarea de Santiago (HU-03).
 */
export function DocumentFilePicker({ onSelect, hasError, disabled }: DocumentFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onSelect(file);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !disabled) onSelect(file);
  }

  return (
    <div
      data-testid="document-drop-area"
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
        isDragging ? 'border-burning-flame bg-burning-flame/10' : 'bg-palladian/50',
        hasError && !isDragging ? 'border-truffle-trouble' : !isDragging && 'border-oatmeal',
        disabled && 'opacity-60',
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-oatmeal/50">
        <UploadCloud aria-hidden="true" className="h-8 w-8 text-abyssal-blue" />
      </span>
      <p className="text-sm font-semibold text-abyssal-blue sm:text-base">
        Arrastra tu documento aquí o{' '}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-truffle-trouble underline underline-offset-2 hover:text-abyssal-blue disabled:cursor-not-allowed"
        >
          haz clic para explorar archivos desde tu equipo
        </button>
      </p>
      <p className="text-xs text-abyssal-blue/70 sm:text-[13px]">
        Formatos permitidos: PDF, PNG o JPG (máx. 5 MB). Asegúrate de que sellos y folios sean legibles.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES}
        className="hidden"
        data-testid="document-input"
        onChange={handleChange}
      />
    </div>
  );
}

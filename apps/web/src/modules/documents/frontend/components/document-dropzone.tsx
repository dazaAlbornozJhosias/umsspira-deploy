'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/shared/utils/cn';
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (CA-03.3)
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export const ERROR_FILE_INVALID =
  'Formato o tamaño no permitido. Adjunta un documento en PDF, PNG o JPG de máximo 5 MB';

export interface DocumentDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Componente Dropzone para carga de archivos de respaldo documental con validación (CA-03.3).
 */
export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  file,
  onFileSelect,
  error: controlledError,
  onErrorChange,
  disabled = false,
  className,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentError = controlledError !== undefined ? controlledError : internalError;

  const setErrorMessage = (msg: string | null) => {
    setInternalError(msg);
    onErrorChange?.(msg);
  };

  const validateFile = (candidate: File): boolean => {
    // 1. Validar tamaño (máximo 5 MB)
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(ERROR_FILE_INVALID);
      return false;
    }

    // 2. Validar formato MIME o extensión
    const hasValidMime = ALLOWED_MIME_TYPES.includes(candidate.type);
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) =>
      candidate.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidMime && !hasValidExt) {
      setErrorMessage(ERROR_FILE_INVALID);
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    const selected = files[0];
    if (validateFile(selected)) {
      onFileSelect(selected);
    } else {
      onFileSelect(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openFileDialog = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const isPdf = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-abyssal">
          Archivo de Respaldo <span className="text-truffle-trouble">*</span>
        </label>
        <span className="text-[11px] font-medium text-abyssal/60">
          PDF, JPG o PNG (≤ 5 MB)
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="Subir documento de respaldo"
      />

      {!file ? (
        /* Zona de arrastre interactiva */
        <div
          role="button"
          tabIndex={0}
          onClick={openFileDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFileDialog();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center outline-none',
            isDragOver
              ? 'border-blue-fantastic bg-blue-fantastic/5 scale-[1.01]'
              : currentError
              ? 'border-truffle-trouble bg-palladian/40'
              : 'border-oatmeal bg-palladian/30 hover:border-blue-fantastic/70 hover:bg-white',
            disabled && 'opacity-50 cursor-not-allowed hover:border-oatmeal hover:bg-palladian/30'
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-palladian text-blue-fantastic">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-sm font-bold text-abyssal">
            Seleccionar archivo local o cámara
          </p>
          <p className="mt-1 text-xs text-abyssal/70">
            O arrastra el documento aquí
          </p>
          <p className="mt-2 text-[11px] font-medium text-abyssal/50">
            Formatos admitidos: PDF, JPG, PNG · Tamaño máx. 5 MB
          </p>
        </div>
      ) : (
        /* Tarjeta de archivo seleccionado y válido */
        <div className="flex items-center justify-between p-4 rounded-xl border border-oatmeal bg-white shadow-sm">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-palladian text-blue-fantastic">
              {isPdf ? <FileText className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs sm:text-sm font-bold text-abyssal" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-abyssal/60 font-medium">
                  {formatFileSize(file.size)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Válido
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-fantastic hover:bg-palladian transition-colors"
              title="Cambiar documento"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cambiar</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-abyssal/60 hover:text-truffle-trouble hover:bg-truffle-trouble/10 transition-colors"
              title="Eliminar archivo"
              aria-label="Quitar archivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alerta de error si el archivo fue rechazado */}
      {currentError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-xs text-truffle-trouble font-medium"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{currentError}</span>
        </div>
      )}
    </div>
  );
};

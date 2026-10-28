"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  uploadDocument,
  type DocumentType,
  type UploadDocumentResult,
} from "../services";
import {
  DOCUMENT_ERROR_MESSAGES,
  validateDocumentFile,
  type PreviewKind,
} from "../validation/document-file";

interface SelectedDocument {
  file: File;
  previewUrl: string;
  previewKind: PreviewKind;
}

/**
 * Maneja el documento elegido por el titulado (HU-03):
 * valida formato y tamano, genera la vista previa local sin subir el archivo (CA-03.4),
 * permite reemplazarlo y lo envia al backend al finalizar (CA-03.2).
 */
export function useDocumentUpload() {
  const [selected, setSelected] = useState<SelectedDocument | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const validationId = useRef(0);

  // Libera la URL temporal de la vista previa al reemplazar el archivo o salir de la pantalla.
  useEffect(() => {
    const previewUrl = selected?.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [selected?.previewUrl]);

  /**
   * Devuelve true si el archivo fue aceptado. Si se rechaza, se conserva el archivo
   * anterior y se muestra el mensaje de CA-03.3.
   */

  const selectFile = useCallback(
    async (file: File | null | undefined): Promise<boolean> => {
      if (!file) {
        validationId.current += 1;
        setSelected(null);
        setFileError(null);
        setIsValidating(false);
        return true;
      }

      const currentId = ++validationId.current;
      setIsValidating(true);

      let previewKind: PreviewKind | null = null;

      try {
        previewKind = await validateDocumentFile(file);
      } catch {
        previewKind = null;
      }

      // Ignorar resultados de una selección anterior.
      if (currentId !== validationId.current) {
        return false;
      }

      setIsValidating(false);

      if (!previewKind) {
        setFileError(DOCUMENT_ERROR_MESSAGES.invalidFile);
        return false;
      }

      setFileError(null);

      setSelected({
        file,
        previewKind,
        previewUrl: URL.createObjectURL(file),
      });

      return true;
    },
    [],
  );

  const upload = useCallback(
    async (
      sessionToken: string,
      tipoDocumento: DocumentType,
    ): Promise<UploadDocumentResult | null> => {
      if (!selected) {
        setFileError(DOCUMENT_ERROR_MESSAGES.missingFile);
        return null;
      }
      setIsUploading(true);
      try {
        return await uploadDocument({
          sessionToken,
          tipoDocumento,
          file: selected.file,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [selected],
  );

  return {
    file: selected?.file ?? null,
    previewUrl: selected?.previewUrl ?? null,
    previewKind: selected?.previewKind ?? null,
    fileError,
    setFileError,
    isUploading,
    isValidating,
    selectFile,
    upload,
  };
}

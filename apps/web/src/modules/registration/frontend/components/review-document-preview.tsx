'use client';

import { useEffect, useState } from 'react';
import { useRegistrationStore } from '../store';
import { readApiError } from '@/shared/services/api-contract';
import { FileText, ImageIcon } from 'lucide-react';
import type { RegistrationDocument } from '../store';
import { formatFileSize } from '@/modules/documents/frontend/validation/document-file';

export interface ReviewDocumentPreviewProps {
  document: RegistrationDocument;
}

/** Vista previa del documento ya cargado en el paso 3 (CA-07.2 y CA-07.3). */
export function ReviewDocumentPreview({ document }: ReviewDocumentPreviewProps) {
  const token = useRegistrationStore((state) => state.sessionToken);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setPreviewUrl(null);
    setError(null);
    async function load() {
      try {
        if (!token) throw new Error('La sesión de registro no está disponible.');
        const response = await fetch(`/api/v1/registrations/sessions/${encodeURIComponent(token)}/document`, {
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(readApiError(body, 'No se pudo recuperar el documento.').message);
        }
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el documento.');
      }
    }
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, document.path, attempt]);
  const previewKind = document.mimeType === 'application/pdf' ? 'pdf' : 'image';
  const Icon = previewKind === 'image' ? ImageIcon : FileText;

  return (
    <div className="overflow-hidden rounded-xl border border-oatmeal/70 bg-white">
      <div className="flex flex-col gap-1 border-b border-oatmeal/60 bg-palladian/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-abyssal-blue">
          <Icon aria-hidden="true" className="h-4 w-4 text-truffle-trouble" />
          Vista previa del documento
        </p>
        <p className="text-xs text-abyssal-blue/70">
          {formatFileSize(document.sizeBytes)} · {document.mimeType === 'application/pdf' ? 'PDF' : 'Imagen'}
        </p>
      </div>

      <div className="flex min-h-[280px] items-center justify-center bg-palladian/30 p-4">
        {previewUrl && previewKind === 'pdf' && (
          <object
            data={previewUrl}
            type="application/pdf"
            aria-label={`Vista previa de ${document.originalName}`}
            className="h-[520px] w-full rounded-md bg-white"
          >
            <p className="p-4 text-center text-sm text-abyssal-blue">
              Tu navegador no puede mostrar el PDF aquí.{' '}
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-truffle-trouble underline"
              >
                Abrir vista previa
              </a>
            </p>
          </object>
        )}

        {previewUrl && previewKind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local de un archivo del usuario (blob:)
          <img
            src={previewUrl}
            alt={`Vista previa de ${document.originalName}`}
            className="max-h-[520px] w-auto rounded-md object-contain shadow-sm"
          />
        )}

        {!previewUrl && (
          <div className="max-w-sm text-center" role={error ? 'alert' : 'status'}>
            <p className="text-sm text-abyssal-blue">{error ?? 'Cargando vista previa...'}</p>
            {error && <button type="button" className="mt-3 font-semibold text-truffle-trouble underline" onClick={() => setAttempt((value) => value + 1)}>Reintentar vista previa</button>}
          </div>
        )}
      </div>
    </div>
  );
}

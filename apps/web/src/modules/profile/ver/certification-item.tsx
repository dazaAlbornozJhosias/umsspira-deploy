import type { KeyboardEvent, ReactNode } from 'react';
import { ChevronDown, Download, FileText } from 'lucide-react';

import type { TimelineItem } from '@/modules/profile/data/profile-data';
import { SAMPLE_BACKUP_URL } from '@/modules/profile/utils/backup-url';

type CertificationItemProps = {
  item: TimelineItem;
  isOpen: boolean;
  onToggle: () => void;
  // Badge de estado del respaldo, lo dibuja la línea de tiempo
  status?: ReactNode;
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-blue-fantastic/60">
        {label}
      </dt>
      <dd className="text-sm font-medium text-blue-fantastic">{value || '—'}</dd>
    </div>
  );
}

export default function CertificationItem({
  item,
  isOpen,
  onToggle,
  status,
}: CertificationItemProps) {
  const detailId = `certificacion-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  // Enter se maneja aquí para no depender del clic implícito del navegador; Espacio queda nativo
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 pb-8">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailId}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="flex w-full flex-col gap-2 rounded text-left md:flex-row md:items-start md:justify-between md:gap-6"
      >
        {/* Información principal */}
        <span className="min-w-0 space-y-1">
          <span className="block text-xl font-bold leading-6 text-blue-fantastic">{item.title}</span>
          <span className="block text-sm font-medium text-blue-fantastic/80">{item.subtitle}</span>
          {item.detail && <span className="block text-xs text-blue-fantastic/60">{item.detail}</span>}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          {status}
          <ChevronDown
            className={`h-4 w-4 text-blue-fantastic/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Documento de respaldo, igual que en la v3 */}
      {item.document && (
        <a
          href={SAMPLE_BACKUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-md border border-oatmeal bg-white px-2 py-1.5 text-[11px] font-semibold text-blue-fantastic transition hover:bg-palladian"
        >
          <FileText className="h-3.5 w-3.5 text-truffle-trouble" aria-hidden="true" />
          {item.document}
        </a>
      )}

      {isOpen && (
        <div id={detailId} className="space-y-3 rounded-[10px] bg-palladian px-[14px] py-3">
          <dl className="flex flex-wrap gap-x-12 gap-y-3">
            <Field label="Entidad emisora" value={item.issuer} />
            <Field label="Año" value={item.year} />
            <Field label="Grado" value={item.grade} />
          </dl>

          {item.document ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-oatmeal bg-white px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-truffle-trouble" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-blue-fantastic">
                {item.document}
              </span>
              {/* Por ahora abre el PDF de ejemplo; se enlaza al archivo real cuando exista el backend */}
              <a
                href={SAMPLE_BACKUP_URL}
          target="_blank"
          rel="noopener noreferrer"
                aria-label={`Descargar ${item.document}`}
                className="shrink-0 rounded p-1 text-blue-fantastic transition hover:bg-palladian"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-blue-fantastic/60">
              Esta certificación no tiene un documento adjunto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

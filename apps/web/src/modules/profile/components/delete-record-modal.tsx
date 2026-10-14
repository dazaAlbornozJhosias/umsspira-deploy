import { Lock, Trash2, WifiOff } from 'lucide-react';

import { SECTION_LABELS } from '@/modules/profile/data/profile-records-data';
import type { DeleteRecordErrorCode, ProfileRecord, RecordSection } from '@/modules/profile/types/profile-record';
import { getRecordColumns } from '@/modules/profile/utils/record-columns';

type DeleteRecordModalProps = {
  section: RecordSection;
  record: ProfileRecord;
  isDeleting: boolean;
  errorCode: DeleteRecordErrorCode | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const ERROR_CONTENT: Record<DeleteRecordErrorCode, { title: string; description: string }> = {
  network: {
    title: 'No se pudo eliminar el registro',
    description: 'Ocurrió un error de conexión. Revisa tu conexión a internet e inténtalo de nuevo.',
  },
  forbidden: {
    title: 'No tienes permiso para eliminar este registro',
    description: 'Este registro pertenece a otro egresado. No se realizó ningún cambio.',
  },
};

const secondaryButtonClassName =
  'rounded-lg border border-truffle-trouble bg-white px-5 py-2.5 text-sm font-bold text-truffle-trouble transition hover:bg-palladian disabled:opacity-50';
const primaryButtonClassName =
  'rounded-lg bg-truffle-trouble px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60';

export function DeleteRecordModal({
  section,
  record,
  isDeleting,
  errorCode,
  onConfirm,
  onCancel,
}: DeleteRecordModalProps) {
  const [primary, secondary, ...rest] = getRecordColumns(section);
  const error = errorCode ? ERROR_CONTENT[errorCode] : null;
  const Icon = errorCode === 'network' ? WifiOff : errorCode === 'forbidden' ? Lock : Trash2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-abyssal-blue/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-record-title"
        className="w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-truffle-trouble/10 text-truffle-trouble">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <h2 id="delete-record-title" className="mt-4 text-lg font-bold leading-snug text-blue-fantastic">
          {error ? error.title : '¿Estás seguro de que deseas eliminar este registro?'}
        </h2>

        {/* Registro seleccionado */}
        <div className="mt-4 rounded-lg border border-oatmeal bg-palladian/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-fantastic/60">
            {SECTION_LABELS[section]}
          </p>
          <p className="text-sm font-bold text-blue-fantastic">{primary.getValue(record)}</p>
          <p className="text-xs text-blue-fantastic/70">
            {[secondary, ...rest].map((column) => column.getValue(record)).join(' · ')}
          </p>
        </div>

        <p role={error ? 'alert' : undefined} className="mt-3 text-xs text-blue-fantastic/70">
          {error ? error.description : 'Solo se quitará este registro. Tus demás registros no cambian.'}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          {errorCode === 'forbidden' ? (
            <button type="button" onClick={onCancel} className={primaryButtonClassName}>
              Entendido
            </button>
          ) : (
            <>
              <button type="button" onClick={onCancel} disabled={isDeleting} className={secondaryButtonClassName}>
                Cancelar
              </button>
              <button type="button" onClick={onConfirm} disabled={isDeleting} className={primaryButtonClassName}>
                {isDeleting ? 'Eliminando...' : errorCode === 'network' ? 'Reintentar' : 'Confirmar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

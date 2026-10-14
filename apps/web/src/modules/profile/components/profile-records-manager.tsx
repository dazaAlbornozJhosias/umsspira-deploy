'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import Link from 'next/link';

import { DeleteRecordModal } from '@/modules/profile/components/delete-record-modal';
import { ProfileRecordsTable } from '@/modules/profile/components/profile-records-table';
import { PROFILE_RECORDS_MOCK, SECTION_LABELS } from '@/modules/profile/data/profile-records-data';
import { DeleteRecordException, deleteProfileRecord } from '@/modules/profile/services/profile-records-service';
import { useOptionalProfileStore } from '@/modules/profile/state/profile-store';
import type {
  DeleteRecordErrorCode,
  ProfileRecord,
  ProfileRecords,
  RecordSection,
} from '@/modules/profile/types/profile-record';
import { removeProfileRecord } from '@/modules/profile/utils/remove-profile-record';
import { cn } from '@/shared/utils/cn';

// Mismo orden de pestañas que la v3 del Figma
const SECTIONS: RecordSection[] = ['education', 'certification', 'experience'];
const TOAST_DURATION_MS = 3000;

type ProfileRecordsManagerProps = {
  initialRecords?: ProfileRecords;
};

export function ProfileRecordsManager({ initialRecords = PROFILE_RECORDS_MOCK }: ProfileRecordsManagerProps) {
  // Dentro de las pantallas del perfil usa el estado compartido; sin proveedor (pruebas) usa su propio estado
  const store = useOptionalProfileStore();
  const [localRecords, setLocalRecords] = useState<ProfileRecords>(initialRecords);
  const records = store?.records ?? localRecords;
  const [activeSection, setActiveSection] = useState<RecordSection>('education');
  const [recordToDelete, setRecordToDelete] = useState<ProfileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<DeleteRecordErrorCode | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible) return;
    const timeoutId = setTimeout(() => setIsToastVisible(false), TOAST_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isToastVisible]);

  function openDeleteModal(record: ProfileRecord) {
    setDeleteError(null);
    setRecordToDelete(record);
  }

  function closeDeleteModal() {
    setRecordToDelete(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!recordToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProfileRecord(recordToDelete);
      // Se actualiza solo la lista en memoria, sin recargar la pantalla
      if (store) {
        store.removeRecord(activeSection, recordToDelete.id);
      } else {
        setLocalRecords((current) => ({
          ...current,
          [activeSection]: removeProfileRecord(current[activeSection], recordToDelete.id),
        }));
      }
      setRecordToDelete(null);
      setIsToastVisible(true);
    } catch (error) {
      setDeleteError(error instanceof DeleteRecordException ? error.code : 'network');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/profile"
          className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-blue-fantastic/70 transition hover:text-blue-fantastic"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al resumen
        </Link>
        <h1 className="text-[28px] font-semibold leading-tight text-blue-fantastic">
          Mis registros del perfil
        </h1>
        <p className="text-sm text-blue-fantastic/70">Edita o elimina tu información profesional.</p>
      </header>

      <Link
        href="/profile/completar"
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-burning-flame px-5 py-3 text-sm font-bold text-abyssal-blue transition hover:brightness-95"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar Registros
      </Link>

      <div role="tablist" aria-label="Secciones del perfil" className="flex gap-6 overflow-x-auto border-b border-oatmeal">
        {SECTIONS.map((section) => {
          const isActive = section === activeSection;
          return (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(section)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm transition',
                isActive
                  ? 'border-truffle-trouble font-bold text-blue-fantastic'
                  : 'border-transparent font-medium text-blue-fantastic/60 hover:text-blue-fantastic',
              )}
            >
              {SECTION_LABELS[section]}
            </button>
          );
        })}
      </div>

      <ProfileRecordsTable section={activeSection} records={records[activeSection]} onDelete={openDeleteModal} />

      {recordToDelete && (
        <DeleteRecordModal
          section={activeSection}
          record={recordToDelete}
          isDeleting={isDeleting}
          errorCode={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
        />
      )}

      {isToastVisible && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-abyssal-blue px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Check className="h-4 w-4 text-burning-flame" aria-hidden="true" />
          Registro eliminado
        </div>
      )}
    </div>
  );
}

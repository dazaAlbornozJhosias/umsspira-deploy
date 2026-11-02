import { PERFIL_URL } from '@/modules/profile/services/perfil-api';
import type { DeleteRecordErrorCode, ProfileRecord, RecordSection } from '@/modules/profile/types/profile-record';
import { markPendingProfileChanges } from '@/shared/hooks/use-recalculate-state';
import { ApiError, apiFetch } from '@/shared/services/api-client';

const API_SECTIONS: Record<RecordSection, string> = {
  education: 'formacion-academica',
  experience: 'experiencia-laboral',
  certification: 'certificaciones',
};

export class DeleteRecordException extends Error {
  readonly code: DeleteRecordErrorCode;

  constructor(code: DeleteRecordErrorCode) {
    super(code);
    this.code = code;
  }
}

// DELETE /api/v1/perfil/{seccion}/{id} -> 204 sin cuerpo; 403 si el registro es de otro egresado.
// Primero responde la API y recién después se quita de la pantalla: si falla, el modal muestra el error
// y la lista no cambia.
export async function deleteProfileRecord(section: RecordSection, record: ProfileRecord): Promise<void> {
  try {
    await apiFetch<void>(`${PERFIL_URL}/${API_SECTIONS[section]}/${record.id}`, { method: 'DELETE' });
    markPendingProfileChanges();
  } catch (error) {
    // 404 = ya no existe en la base: el resultado es el mismo que haberlo eliminado
    if (error instanceof ApiError && error.status === 404) {
      markPendingProfileChanges();
      return;
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new DeleteRecordException('forbidden');
    }
    throw new DeleteRecordException('network');
  }
}
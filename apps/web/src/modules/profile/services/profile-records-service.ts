import { PERFIL_URL } from '@/modules/profile/services/perfil-api';
import type { DeleteRecordErrorCode, ProfileRecord, RecordSection } from '@/modules/profile/types/profile-record';
import { ApiError, apiFetch } from '@/shared/services/api-client';

// Nombre de cada sección en las rutas del backend (PROFILE_SECTIONS del módulo profile de la API)
const API_SECTIONS: Record<RecordSection, string> = {
  education: 'formacion-academica',
  experience: 'experiencia-laboral',
  certification: 'certificaciones',
};

export class DeleteRecordException extends Error {
  constructor(public readonly code: DeleteRecordErrorCode) {
    super(code === 'forbidden' ? 'Forbidden (403)' : 'Network error');
    this.name = 'DeleteRecordException';
  }
}

// DELETE /api/v1/perfil/:seccion/:id -> 204. La eliminación es física (se borra de la base).
// 403 = el registro es de otro egresado; cualquier otro fallo se muestra como error de conexión
// y la lista no cambia.
export async function deleteProfileRecord(section: RecordSection, record: ProfileRecord): Promise<void> {
  try {
    await apiFetch<void>(`${PERFIL_URL}/${API_SECTIONS[section]}/${record.id}`, { method: 'DELETE' });
  } catch (error) {
    // 404 = ya no existe en la base: el resultado es el mismo que haberlo eliminado
    if (error instanceof ApiError && error.status === 404) return;
    throw new DeleteRecordException(error instanceof ApiError && error.status === 403 ? 'forbidden' : 'network');
  }
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { CURRENT_GRADUATE_ID, PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { obtenerPerfil } from '@/modules/profile/services/perfil-api';
import type {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecord,
  ProfileRecords,
  RecordSection,
} from '@/modules/profile/types/profile-record';

// id es el que devuelve la API al crear; sin id se genera uno local
type NewRecord<T> = Omit<T, 'id' | 'ownerId'> & { id?: string };

type ProfileStore = {
  records: ProfileRecords;
  addEducation: (record: NewRecord<EducationRecord>) => void;
  addExperience: (record: NewRecord<ExperienceRecord>) => void;
  addCertification: (record: NewRecord<CertificationRecord>) => void;
  updateRecord: (section: RecordSection, record: ProfileRecord) => void;
  removeRecord: (section: RecordSection, recordId: string) => void;
};

const ProfileStoreContext = createContext<ProfileStore | null>(null);

// Demo sin backend: los cambios se guardan en el navegador para que se conserven al recargar
// v2: los respaldos de prueba pasaron a JPG; se descartan los datos guardados con la versión anterior
const STORAGE_KEY = 'umsspira-perfil-demo-v2';

function leerGuardado(): ProfileRecords | null {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado ? (JSON.parse(guardado) as ProfileRecords) : null;
  } catch {
    return null;
  }
}

let nextId = 0;
function createId(section: RecordSection): string {
  nextId += 1;
  return `${section}-nuevo-${nextId}`;
}

/**
 * Estado compartido del perfil para todas sus pantallas (resumen, completar, mis registros y edición).
 * Al montarse carga los registros reales con GET /api/v1/perfil; si la API no responde se quedan
 * los datos de prueba. Con initialRecords (pruebas) no se consulta la API.
 */
export function ProfileStoreProvider({
  children,
  initialRecords,
}: {
  children: React.ReactNode;
  initialRecords?: ProfileRecords;
}) {
  const [records, setRecords] = useState<ProfileRecords>(initialRecords ?? PROFILE_RECORDS_MOCK);
  const cargarDesdeApi = initialRecords === undefined;
  const restaurado = useRef(false);

  useEffect(() => {
    if (!cargarDesdeApi) return;
    const guardado = leerGuardado();
    if (guardado) setRecords(guardado);
    restaurado.current = true;
    let vigente = true;
    obtenerPerfil()
      .then((perfil) => {
        if (vigente) setRecords(perfil);
      })
      .catch(() => {
        // Sin conexión con la API: se mantienen los datos de prueba
      });
    return () => {
      vigente = false;
    };
  }, [cargarDesdeApi]);

  useEffect(() => {
    if (!cargarDesdeApi || !restaurado.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Sin acceso al almacenamiento: los cambios duran hasta recargar
    }
  }, [cargarDesdeApi, records]);

  const addRecord = useCallback((section: RecordSection, record: NewRecord<ProfileRecord>) => {
    const created = { ...record, id: record.id ?? createId(section), ownerId: CURRENT_GRADUATE_ID } as ProfileRecord;
    setRecords((current) => ({ ...current, [section]: [...current[section], created] }));
  }, []);

  const updateRecord = useCallback((section: RecordSection, record: ProfileRecord) => {
    setRecords((current) => ({
      ...current,
      [section]: current[section].map((item) => (item.id === record.id ? record : item)),
    }));
  }, []);

  const removeRecord = useCallback((section: RecordSection, recordId: string) => {
    setRecords((current) => ({
      ...current,
      [section]: current[section].filter((item) => item.id !== recordId),
    }));
  }, []);

  const value = useMemo<ProfileStore>(
    () => ({
      records,
      addEducation: (record) => addRecord('education', record),
      addExperience: (record) => addRecord('experience', record),
      addCertification: (record) => addRecord('certification', record),
      updateRecord,
      removeRecord,
    }),
    [records, addRecord, updateRecord, removeRecord],
  );

  return <ProfileStoreContext.Provider value={value}>{children}</ProfileStoreContext.Provider>;
}

/** Devuelve el estado del perfil, o null si el componente se usa fuera del proveedor (por ejemplo en pruebas). */
export function useOptionalProfileStore(): ProfileStore | null {
  return useContext(ProfileStoreContext);
}

export function useProfileStore(): ProfileStore {
  const store = useOptionalProfileStore();
  if (!store) throw new Error('useProfileStore debe usarse dentro de ProfileStoreProvider');
  return store;
}

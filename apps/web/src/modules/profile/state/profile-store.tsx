'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { CURRENT_GRADUATE_ID, PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { obtenerResumenPerfil } from '@/modules/profile/services/perfil-api';
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
  // Descripción profesional del egresado; vacía = sin registrar
  description: string;
  isLoading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  addEducation: (record: NewRecord<EducationRecord>) => void;
  addExperience: (record: NewRecord<ExperienceRecord>) => void;
  addCertification: (record: NewRecord<CertificationRecord>) => void;
  updateRecord: (section: RecordSection, record: ProfileRecord) => void;
  removeRecord: (section: RecordSection, recordId: string) => void;
  // Reemplaza la descripción con la que quedó guardada (HU-06)
  setDescription: (description: string) => void;
};

const ProfileStoreContext = createContext<ProfileStore | null>(null);

// Demo sin backend: los cambios se guardan en el navegador para que se conserven al recargar
// v2: los respaldos de prueba pasaron a JPG; se descartan los datos guardados con la versión anterior
const STORAGE_KEY = 'umsspira-perfil-demo-v2';

const DESCRIPTION_STORAGE_KEY = `${STORAGE_KEY}-descripcion`;

function leerDescripcionGuardada(): string | null {
  try {
    return localStorage.getItem(DESCRIPTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

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
  initialDescription = '',
}: {
  children: React.ReactNode;
  initialRecords?: ProfileRecords;
  initialDescription?: string;
}) {
  const [records, setRecords] = useState<ProfileRecords>(initialRecords ?? PROFILE_RECORDS_MOCK);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(initialRecords === undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const cargarDesdeApi = initialRecords === undefined;
  const restaurado = useRef(false);

  useEffect(() => {
    if (!cargarDesdeApi) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    const guardado = leerGuardado();
    if (guardado) setRecords(guardado);
    const descripcionGuardada = leerDescripcionGuardada();
    if (descripcionGuardada !== null) setDescription(descripcionGuardada);
    restaurado.current = true;

    let vigente = true;

    async function cargarPerfil() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const perfil = await obtenerResumenPerfil();

        if (vigente) {
          setRecords(perfil.records);
          setDescription(perfil.description);
        }
      } catch {
        // Demo sin backend: sin conexión con la API se mantienen los datos de prueba (o los guardados)
      } finally {
        if (vigente) {
          setIsLoading(false);
        }
      }
    }

    void cargarPerfil();

    return () => {
      vigente = false;
    };
  }, [cargarDesdeApi, loadAttempt]);

  useEffect(() => {
    if (!cargarDesdeApi || !restaurado.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      localStorage.setItem(DESCRIPTION_STORAGE_KEY, description);
    } catch {
      // Sin acceso al almacenamiento: los cambios duran hasta recargar
    }
  }, [cargarDesdeApi, records, description]);

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

  const retryLoad = useCallback(() => {
    setLoadAttempt((current) => current + 1);
  }, []);

  const value = useMemo<ProfileStore>(
    () => ({
      records,
      description,
      isLoading,
      loadError,
      retryLoad,
      addEducation: (record) => addRecord('education', record),
      addExperience: (record) => addRecord('experience', record),
      addCertification: (record) => addRecord('certification', record),
      updateRecord,
      removeRecord,
      setDescription,
    }),
    [records, description, isLoading, loadError, retryLoad, addRecord, updateRecord, removeRecord],
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

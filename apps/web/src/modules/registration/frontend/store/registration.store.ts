import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PersonalData {
  nombres: string;
  apellidos: string;
  ci: string;
  complementoCi: string;
  expedidoEn: string;
  correo: string;
  telefono: string;
  carreraId: string;
  anioEgreso: number;
  codigoSis: string;
}

export interface ConfirmationInfo {
  estado: string;
  fechaEnvio: string;
  nombreCompleto: string;
  ci: string;
  correoEnmascarado: string;
  plazoHoras: number;
}

export interface RegistrationState {
  sessionToken: string | null;
  personalData: PersonalData | null;
  confirmation: ConfirmationInfo | null;
  setSessionToken: (token: string) => void;
  setPersonalData: (data: PersonalData) => void;
  setConfirmation: (confirmation: ConfirmationInfo) => void;
  reset: () => void;
}

export const REGISTRATION_STORAGE_KEY = 'umsspira-registration';

/**
 * Estado compartido del registro publico (datos, verificacion de correo y documento).
 * El token y los datos se guardan en el navegador para que el titulado pueda retomar
 * el proceso; el backend decide si la sesion sigue vigente (2 horas, CA-01.6).
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      sessionToken: null,
      personalData: null,
      confirmation: null,
      setSessionToken: (sessionToken: string) => set({ sessionToken }),
      setPersonalData: (personalData: PersonalData) => set({ personalData }),
      setConfirmation: (confirmation: ConfirmationInfo) => set({ confirmation }),
      reset: () => set({ sessionToken: null, personalData: null, confirmation: null }),
    }),
    {
      name: REGISTRATION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sessionToken: state.sessionToken, personalData: state.personalData }),
    },
  ),
);

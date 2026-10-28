'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import { MensajeError } from '@/modules/profile/validation/mensaje-error';
import { ApiError } from '@/shared/services/api-client';

// Mismo límite que el backend (PROFESSIONAL_DESCRIPTION_MAX_LENGTH)
export const MAX_DESCRIPCION = 5000;

type FormularioDescripcionProps = {
  descripcion: string;
  // Si la promesa falla con ApiError se muestra su mensaje y el texto escrito se conserva
  onGuardar: (descripcion: string) => void | Promise<void>;
};

// Sección "Descripción profesional" de Completar perfil (HU-06): cuadro de texto, contador y Guardar
export function FormularioDescripcion({ descripcion, onGuardar }: FormularioDescripcionProps) {
  const [texto, setTexto] = useState(descripcion);
  // El perfil llega de la API después de montarse: se copia mientras el egresado no haya escrito
  const [editado, setEditado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!editado) setTexto(descripcion);
  }, [descripcion, editado]);
  const [guardada, setGuardada] = useState(false);
  // Mensaje del backend (400) o de conexión, tal como lo envía apiFetch
  const [errorGuardar, setErrorGuardar] = useState<string>();

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setGuardada(false);
    setErrorGuardar(undefined);
    try {
      await onGuardar(texto.trim());
      setGuardada(true);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setErrorGuardar(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-[#1B2632]">Descripción profesional</span>
        <textarea
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setEditado(true);
            setGuardada(false);
            setErrorGuardar(undefined);
          }}
          maxLength={MAX_DESCRIPCION}
          rows={6}
          placeholder="Cuenta en pocas líneas a qué te dedicas, tus fortalezas y lo que buscas"
          aria-invalid={Boolean(errorGuardar)}
          aria-describedby="contador-descripcion error-descripcion-guardar"
          className="min-h-[140px] resize-y rounded-lg border border-[#C9C1B1] bg-[#EEE9DF] px-3 py-2.5 text-sm leading-[1.6] text-[#1B2632] outline-none placeholder:text-[#2C3B4D]/40 focus:border-2 focus:border-[#2C3B4D] focus:bg-white"
        />
      </label>

      <MensajeError id="error-descripcion-guardar" mensaje={errorGuardar} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id="contador-descripcion" className="text-xs text-[#2C3B4D]/70">
          {texto.length}/{MAX_DESCRIPCION} caracteres
        </span>
        <div className="flex items-center gap-3">
          {guardada && (
            <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-[#0F5132]">
              <Check className="h-4 w-4" aria-hidden="true" />
              Descripción guardada
            </span>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="h-11 rounded-lg bg-[#FFB162] px-6 text-sm font-semibold text-[#1B2632] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}

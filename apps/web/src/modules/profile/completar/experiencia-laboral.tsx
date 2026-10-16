'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { MensajeError, claseCampo } from '@/modules/profile/validation/mensaje-error';
import { FECHA_MINIMA_EXPERIENCIA, validarRangoFechas } from '@/modules/profile/validation/reglas-perfil';
import { ApiError } from '@/shared/services/api-client';

export type Experiencia = {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin?: string;
};
type FormularioExperienciaProps = {
  experiencias:Experiencia[];
  // Si la promesa falla con ApiError (400...), se muestra su mensaje y no se limpia el formulario
  onAgregar: (experiencia: Experiencia) => void | Promise<void>;
};

type Datos = {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string;
};

const VACIO: Datos = { empresa: '', cargo: '', fechaInicio: '', fechaFin: '' };

const CAMPOS: { nombre: keyof Datos; etiqueta: string; tipo: 'text' | 'date'; ejemplo?: string }[] = [
  { nombre: 'empresa', etiqueta: 'Empresa', tipo: 'text', ejemplo: 'Ej. Jalasoft' },
  { nombre: 'cargo', etiqueta: 'Cargo', tipo: 'text', ejemplo: 'Ej. Desarrollador Frontend' },
  { nombre: 'fechaInicio', etiqueta: 'fecha inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'fecha fin', tipo: 'date' },
];

function mostrarFecha(fecha: string) {
  const [anio, mes] = fecha.split('-');
  return `${mes}/${anio}`;
}

export function FormularioExperiencia({experiencias, onAgregar }: FormularioExperienciaProps) {
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [trabajoActual, setTrabajoActual] = useState(false);
  // Error de la fecha fin (anterior a la fecha inicio); una vez mostrado se recalcula mientras se corrige
  const [errorFechaFin, setErrorFechaFin] = useState<string>();
  // Mensaje del backend al guardar, tal como lo envía; se quita al cambiar cualquier campo
  const [errorGuardar, setErrorGuardar] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const completo = CAMPOS.every((campo) => (campo.nombre === 'fechaFin' && trabajoActual) || datos[campo.nombre].trim() !== '',
  );

  const ordenadas = [...experiencias].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!completo || guardando) return;
    const error = trabajoActual ? undefined : validarRangoFechas(datos.fechaInicio, datos.fechaFin);
    setErrorFechaFin(error);
    if (error) return;
    setGuardando(true);
    try {
      await onAgregar({
        empresa: datos.empresa.trim(),
        cargo: datos.cargo.trim(),
        fechaInicio: datos.fechaInicio,
        fechaFin: trabajoActual ? undefined : datos.fechaFin,
      });
      setDatos(VACIO);
      setTrabajoActual(false);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setErrorGuardar(error.message);
    } finally {
      setGuardando(false);
    }
  }

  function cambiar(campo: keyof Datos, valor: string) {
    const nuevos = { ...datos, [campo]: valor };
    setDatos(nuevos);
    setErrorGuardar(undefined);
    if (errorFechaFin) setErrorFechaFin(validarRangoFechas(nuevos.fechaInicio, nuevos.fechaFin));
  }
  return (
    <div className="flex flex-col gap-5">
        {experiencias.length > 0 && (
        <ul className="flex flex-col gap-2">
          {ordenadas.map((experiencia, indice) => (
            <li
              key={`${experiencia.empresa}-${indice}`}
              className="flex items-center gap-3 rounded-xl border border-[#C9C1B1]/70 bg-[#FAF8F4] px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEE9DF]">
                <Briefcase className="h-4 w-4 text-[#2C3B4D]" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1B2632]">{experiencia.cargo}</span>
                <span className="block text-xs text-[#2C3B4D]/70">
                  {experiencia.empresa} · {mostrarFecha(experiencia.fechaInicio)} - {' '}
                  {experiencia.fechaFin ? mostrarFecha(experiencia.fechaFin) : 'Actualidad'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={agregar} className="flex flex-col gap-4">  
        <div className="grid gap-4 md:grid-cols-2">
        {CAMPOS.map((campo) => {
          const esFin = campo.nombre === 'fechaFin';
          const deshabilitado = esFin && trabajoActual;

      return (
          <label key={campo.nombre} className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[#1B2632]">
              {campo.etiqueta} 
              {!deshabilitado && <span className="text-[#A35139]"> *</span>}
            </span>
            <input
              type={campo.tipo}
              min={campo.tipo === 'date' ? FECHA_MINIMA_EXPERIENCIA : undefined}
              value={datos[campo.nombre]}
              onChange={(e) => cambiar(campo.nombre, e.target.value)}
              placeholder={campo.ejemplo}
              disabled={deshabilitado}
              aria-invalid={esFin ? Boolean(errorFechaFin) : undefined}
              aria-describedby={esFin ? 'error-fechaFin' : undefined}
              className={claseCampo(
                'h-11 rounded-lg border border-[#C9C1B1] bg-[#EEE9DF] px-3 text-sm text-[#1B2632] outline-none placeholder:text-[#2C3B4D]/40 focus:border-2 focus:border-[#2C3B4D] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50',
                esFin ? errorFechaFin : undefined,
              )}
            />
            {esFin && <MensajeError id="error-fechaFin" mensaje={errorFechaFin} />}
          </label>
        );
      })}
      </div>
      <label className="flex items-center gap-2 text-sm text-[#1B2632]">
          <input
            type="checkbox"
            checked={trabajoActual}
            onChange={(e) => {
              setTrabajoActual(e.target.checked);
              setDatos({ ...datos, fechaFin: '' });
              setErrorFechaFin(undefined);
              setErrorGuardar(undefined);
            }}
            className="h-4 w-4 accent-[#A35139]"
          />
          Actualmente trabajo aquí
        </label>

      <MensajeError id="error-experiencia-guardar" mensaje={errorGuardar} />

      <div className="flex justify-end">
          <button
            type="submit"
            disabled={!completo || guardando}
            className="h-11 rounded-lg bg-[#FFB162] px-6 text-sm font-semibold text-[#1B2632] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar experiencia
          </button>
        </div>
      </form>
  </div>  
  );
}
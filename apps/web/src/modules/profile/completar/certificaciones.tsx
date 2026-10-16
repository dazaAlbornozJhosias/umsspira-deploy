'use client';

import { useRef, useState } from 'react';
import { Award, Camera, CloudUpload, FileText, Plus } from 'lucide-react';
import { MensajeError, claseCampo } from '@/modules/profile/validation/mensaje-error';
import { validarRespaldo } from '@/modules/profile/validation/reglas-perfil';

const GRADOS = ['Fundamentos', 'Asociado', 'Profesional', 'Especialista', 'Experto'];

export type Certificacion = {
  nombre: string;
  entidadEmisora: string;
  anioEmision: string;
  grado: string;
  respaldo: File | null;
};

type FormularioCertificacionesProps = {
  certificaciones: Certificacion[];
  onAgregar: (certificacion: Certificacion) => void;
};

const VACIO: Certificacion = { nombre: '', entidadEmisora: '', anioEmision: '', grado: '', respaldo: null };

const subtituloClase = 'text-xs font-bold uppercase tracking-wide text-[#2C3B4D]';
const labelClase = 'block text-xs font-semibold text-[#2C3B4D]';
const inputClase =
  'mt-1.5 h-11 w-full rounded-md border border-[#C9C1B1] bg-white px-3 text-sm text-[#2C3B4D] placeholder:text-[#2C3B4D]/40 focus:border-[#FFB162] focus:outline-none';
const botonRespaldoClase =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-[#C9C1B1] bg-white px-3 text-xs font-semibold text-[#2C3B4D] hover:bg-[#FAF8F4]';

export function FormularioCertificaciones({ certificaciones, onAgregar }: FormularioCertificacionesProps) {
  const [datos, setDatos] = useState<Certificacion>(VACIO);
  const fotoRef = useRef<HTMLInputElement>(null);
  const documentoRef = useRef<HTMLInputElement>(null);
  // Archivo rechazado (no es JPG o supera 5 MB): no se adjunta y se explica junto al campo
  const [errorRespaldo, setErrorRespaldo] = useState<string>();

  function cambiar(campo: 'nombre' | 'entidadEmisora' | 'anioEmision' | 'grado', valor: string) {
    setDatos({ ...datos, [campo]: valor });
  }

  function elegirRespaldo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    // El atributo accept se puede saltar eligiendo "Todos los archivos"
    const error = validarRespaldo(archivo);
    setErrorRespaldo(error);
    if (!error) setDatos({ ...datos, respaldo: archivo });
  }

  function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onAgregar({
      ...datos,
      nombre: datos.nombre.trim(),
      entidadEmisora: datos.entidadEmisora.trim(),
    });
    setDatos(VACIO);
    setErrorRespaldo(undefined);
  }

  return (
    <div>
      {certificaciones.length > 0 && (
        <div className="mb-5 border-b border-[#C9C1B1]/70 pb-5">
          <p className={subtituloClase}>Certificaciones registradas</p>
          <ul className="mt-3 space-y-2">
            {certificaciones.map((certificacion, indice) => (
              <li
                key={`${certificacion.nombre}-${indice}`}
                className="flex items-center gap-3 rounded-lg border border-[#C9C1B1]/70 bg-[#EEE9DF] px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1B2632]">
                  <Award className="h-4 w-4 text-[#FFB162]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#2C3B4D]">
                    {certificacion.nombre}
                  </span>
                  <span className="block truncate text-xs text-[#2C3B4D]/70">
                    {certificacion.entidadEmisora} • {certificacion.anioEmision} • {certificacion.grado}
                    {certificacion.respaldo && ' • Con respaldo'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={subtituloClase}>Agregar nueva certificación</p>

      <form onSubmit={agregar} className="mt-4 space-y-4">
        <div>
          <label htmlFor="nombreCertificacion" className={labelClase}>Nombre de certificación</label>
          <input
            id="nombreCertificacion"
            type="text"
            required
            placeholder="Ej. AWS Cloud Practitioner"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            className={inputClase}
          />
        </div>

        <div>
          <label htmlFor="entidadEmisora" className={labelClase}>Entidad emisora</label>
          <input
            id="entidadEmisora"
            type="text"
            required
            placeholder="Ej. Amazon Web Services"
            value={datos.entidadEmisora}
            onChange={(e) => cambiar('entidadEmisora', e.target.value)}
            className={inputClase}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="anioEmision" className={labelClase}>Año</label>
            <input
              id="anioEmision"
              type="text"
              inputMode="numeric"
              required
              minLength={4}
              maxLength={4}
              pattern="\d{4}"
              title="Ingresa un año de 4 dígitos"
              placeholder="Ej. 2023"
              value={datos.anioEmision}
              onChange={(e) => cambiar('anioEmision', e.target.value.replace(/\D/g, ''))}
              className={inputClase}
            />
          </div>

          <div>
            <label htmlFor="gradoCertificacion" className={labelClase}>Grado</label>
            <select
              id="gradoCertificacion"
              required
              value={datos.grado}
              onChange={(e) => cambiar('grado', e.target.value)}
              className={inputClase}
            >
              <option value="" disabled>Selecciona un grado</option>
              {GRADOS.map((grado) => (
                <option key={grado} value={grado}>{grado}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className={labelClase}>Respaldo de certificación</span>
          <div
            className={claseCampo(
              'mt-1.5 flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-[#C9C1B1] bg-[#EEE9DF] px-4 py-6 text-center',
              errorRespaldo,
            )}
          >
            {datos.respaldo ? (
              <p className="flex max-w-full items-center gap-2 text-sm font-medium text-[#2C3B4D]">
                <FileText className="h-4 w-4 shrink-0 text-[#A35139]" />
                <span className="truncate">{datos.respaldo.name}</span>
              </p>
            ) : (
              <>
                <CloudUpload className="h-6 w-6 text-[#A35139]" />
                <p className="text-sm text-[#2C3B4D]">Adjunta una foto o un documento de tu certificación</p>
              </>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => fotoRef.current?.click()} className={botonRespaldoClase}>
                <Camera className="h-4 w-4" />
                Subir foto
              </button>
              <button type="button" onClick={() => documentoRef.current?.click()} className={botonRespaldoClase}>
                <FileText className="h-4 w-4" />
                Subir documento
              </button>
            </div>
            {/* Decisión del equipo: el backend y el almacenamiento solo aceptan JPG (BUG-HU2-007) */}
            <p className="text-xs text-[#2C3B4D]/70">Solo JPG, máximo 5 MB</p>
          </div>
          <MensajeError id="error-respaldo" mensaje={errorRespaldo} />

          <input
            ref={fotoRef}
            type="file"
            accept="image/jpeg"
            aria-label="Subir foto"
            className="hidden"
            onChange={elegirRespaldo}
          />
          <input
            ref={documentoRef}
            type="file"
            accept="image/jpeg"
            aria-label="Subir documento"
            className="hidden"
            onChange={elegirRespaldo}
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#2C3B4D] bg-white px-4 text-sm font-medium text-[#2C3B4D] hover:bg-[#EEE9DF] md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Agregar certificación
        </button>
      </form>
    </div>
  );
}

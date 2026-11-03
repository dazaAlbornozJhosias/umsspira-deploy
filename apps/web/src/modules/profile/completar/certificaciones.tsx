
'use client';
 
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Award, Camera, Check, CloudUpload, FileText, Plus } from 'lucide-react';
import { MensajeError, claseCampo } from '@/modules/profile/validation/mensaje-error';
import {
  type ErroresCertificacion,
  validarCertificacion,
  validarRespaldo,
} from '@/modules/profile/validation/reglas-perfil';
import { formatearTamanio } from '@/modules/profile/utils/format-file-size';
import { ApiError } from '@/shared/services/api-client';
 
export type Certificacion = {
  nombre: string;
  entidadEmisora: string;
  anioEmision: string;
  grado: string;
  respaldo: File | null;
};
 
type FormularioCertificacionesProps = {
  certificaciones: Certificacion[];
  // Si la promesa falla con ApiError se muestra su mensaje y se conserva lo escrito
  onAgregar: (certificacion: Certificacion) => void | Promise<void>;
  // Avance (0 a 100) de la subida del respaldo mientras se guarda
  progreso?: number;
  // Ruta interna desde la que se llegó (por ejemplo /afinidad desde la Épica 3); al guardar se ofrece volver ahí (T8.5)
  returnTo?: string;
  // Avisa cuántos errores hay a la vista, para el contador del encabezado de la sección (HU-02, AC 6)
  onErroresChange?: (errores: number) => void;
};
 
const VACIO: Certificacion = { nombre: '', entidadEmisora: '', anioEmision: '', grado: '', respaldo: null };
 
const subtituloClase = 'text-xs font-bold uppercase tracking-wide text-[#2C3B4D]';
const labelClase = 'block text-xs font-semibold text-[#2C3B4D]';
// Asterisco de obligatorio con CSS (::after): no cambia el texto de la etiqueta que leen los lectores de pantalla y los tests
const labelObligatorioClase = `${labelClase} after:ml-0.5 after:text-truffle-trouble after:content-['*']`;
const inputClase =
  'mt-1.5 h-11 w-full rounded-md border border-[#C9C1B1] bg-white px-3 text-sm text-[#2C3B4D] placeholder:text-[#2C3B4D]/40 focus:border-[#FFB162] focus:outline-none';
const botonRespaldoClase =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-[#C9C1B1] bg-white px-3 text-xs font-semibold text-[#2C3B4D] hover:bg-[#FAF8F4]';
 
export function FormularioCertificaciones({
  certificaciones,
  onAgregar,
  progreso,
  returnTo,
  onErroresChange,
}: FormularioCertificacionesProps) {
  const [datos, setDatos] = useState<Certificacion>(VACIO);
  const fotoRef = useRef<HTMLInputElement>(null);
  const documentoRef = useRef<HTMLInputElement>(null);
  // Archivo rechazado (no es JPG o supera 5 MB): no se adjunta y se explica junto al campo
  const [errorRespaldo, setErrorRespaldo] = useState<string>();
  // Errores por campo al intentar agregar (T8.3); con alguno no se envía nada a la API
  const [errores, setErrores] = useState<ErroresCertificacion>({});
  const [guardando, setGuardando] = useState(false);
  // Mensaje del backend al guardar, tal como lo envía; se quita al cambiar cualquier campo
  const [errorGuardar, setErrorGuardar] = useState<string>();
  // Dirección local de la foto elegida para mostrar su miniatura
  const [vistaPrevia, setVistaPrevia] = useState<string>();
  // Aviso «Certificación guardada» tras guardar (T8.5); se quita al empezar a escribir otra
  const [guardada, setGuardada] = useState(false);

  const cantidadErrores = [errorRespaldo, errorGuardar].filter(Boolean).length;
  useEffect(() => onErroresChange?.(cantidadErrores), [cantidadErrores, onErroresChange]);
 
  // Se crea al elegir la foto y se libera al quitarla, cambiarla o salir (evita fugas de memoria)
  useEffect(() => {
    if (!datos.respaldo || typeof URL.createObjectURL !== 'function') {
      setVistaPrevia(undefined);
      return;
    }
    const url = URL.createObjectURL(datos.respaldo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [datos.respaldo]);
 
  function quitarRespaldo() {
    setDatos({ ...datos, respaldo: null });
    setErrorRespaldo(undefined);
  }
 
  // Al corregir un campo se quita su mensaje
  function limpiarError(campo: keyof ErroresCertificacion) {
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  }
 
  function cambiar(campo: 'nombre' | 'entidadEmisora' | 'anioEmision', valor: string) {
    setDatos({ ...datos, [campo]: valor });
    limpiarError(campo);
    setErrorGuardar(undefined);
    setGuardada(false);
  }
 
  function elegirRespaldo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    // El atributo accept se puede saltar eligiendo "Todos los archivos"
    const error = validarRespaldo(archivo);
    setErrorRespaldo(error);
    if (!error) {
      setDatos({ ...datos, respaldo: archivo });
      limpiarError('respaldo');
    }
  }
 
  async function guardar() {
    if (guardando) return;
    setErrorGuardar(undefined);
    setGuardada(false);
    setGuardando(true);
    try {
      await onAgregar({
        ...datos,
        nombre: datos.nombre.trim(),
        entidadEmisora: datos.entidadEmisora.trim(),
      });
      setDatos(VACIO);
      setErrorRespaldo(undefined);
      setGuardada(true);
    } catch (error) {
      // Se conserva lo escrito y la foto elegida: «Reintentar» vuelve a enviar lo mismo (T8.6)
      if (!(error instanceof ApiError)) throw error;
      setErrorGuardar(`No se pudo guardar la certificación. ${error.message}`);
    } finally {
      setGuardando(false);
    }
  }
 
  function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validarCertificacion(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    void guardar();
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
 
      <form onSubmit={agregar} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="nombreCertificacion" className={labelObligatorioClase}>Nombre de certificación</label>
          <input
            id="nombreCertificacion"
            type="text"
            required
            placeholder="Ej. AWS Cloud Practitioner"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            className={claseCampo(inputClase, errores.nombre)}
          />
          <MensajeError id="error-nombre" mensaje={errores.nombre} />
        </div>
 
        <div>
          <label htmlFor="entidadEmisora" className={labelObligatorioClase}>Entidad emisora</label>
          <input
            id="entidadEmisora"
            type="text"
            required
            placeholder="Ej. Amazon Web Services"
            value={datos.entidadEmisora}
            onChange={(e) => cambiar('entidadEmisora', e.target.value)}
            aria-invalid={Boolean(errores.entidadEmisora)}
            aria-describedby={errores.entidadEmisora ? 'error-entidadEmisora' : undefined}
            className={claseCampo(inputClase, errores.entidadEmisora)}
          />
          <MensajeError id="error-entidadEmisora" mensaje={errores.entidadEmisora} />
        </div>
 
        <div>
          <label htmlFor="anioEmision" className={labelObligatorioClase}>Año</label>
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
            aria-invalid={Boolean(errores.anioEmision)}
            aria-describedby={errores.anioEmision ? 'error-anioEmision' : undefined}
            className={claseCampo(inputClase, errores.anioEmision)}
          />
          <MensajeError id="error-anioEmision" mensaje={errores.anioEmision} />
        </div>
 
        <div>
          <span className={labelObligatorioClase}>Respaldo de certificación</span>
          <div
            className={claseCampo(
              'mt-1.5 flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-[#C9C1B1] bg-[#EEE9DF] px-4 py-6 text-center',
              errorRespaldo ?? errores.respaldo,
            )}
          >
            {datos.respaldo ? (
              <div className="flex w-full max-w-full items-center gap-3 text-left">
                {vistaPrevia ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vistaPrevia}
                    alt="Vista previa del respaldo"
                    className="h-16 w-16 shrink-0 rounded-md border border-[#C9C1B1] object-cover"
                  />
                ) : (
                  <FileText className="h-8 w-8 shrink-0 text-[#A35139]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#2C3B4D]">
                    {datos.respaldo.name}
                  </span>
                  <span className="block text-xs text-[#2C3B4D]/70">
                    {formatearTamanio(datos.respaldo.size)}
                  </span>
                </span>
                <button type="button" onClick={quitarRespaldo} className={botonRespaldoClase}>
                  Quitar
                </button>
              </div>
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
          <MensajeError id="error-respaldo" mensaje={errorRespaldo ?? errores.respaldo} />
 
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
 
        {guardando && (
          <div
            role="progressbar"
            aria-label="Avance de la subida"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progreso ?? 0}
            className="h-2 w-full overflow-hidden rounded-full bg-[#EEE9DF]"
          >
            <div className="h-full bg-[#A35139] transition-all" style={{ width: `${progreso ?? 0}%` }} />
          </div>
        )}
        {guardada && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-semibold text-[#2C3B4D]">
            <Check className="h-4 w-4 text-[#A35139]" aria-hidden="true" />
            Certificación guardada
          </p>
        )}
        {guardada && returnTo && (
          <Link
            href={returnTo}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-burning-flame px-4 text-sm font-bold text-abyssal-blue transition hover:brightness-95 md:w-auto"
          >
            Ver mi afinidad →
          </Link>
        )}
        <MensajeError id="error-certificacion-guardar" mensaje={errorGuardar} />
        {errorGuardar && (
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            className="inline-flex h-9 items-center rounded-md border border-[#A35139] bg-white px-3 text-xs font-semibold text-[#A35139] hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reintentar
          </button>
        )}
 
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#2C3B4D] bg-white px-4 text-sm font-medium text-[#2C3B4D] hover:bg-[#EEE9DF] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          <Plus className="h-4 w-4" />
          {guardando ? `Guardando…${progreso !== undefined ? ` ${progreso} %` : ''}` : 'Agregar certificación'}
        </button>
      </form>
    </div>
  );
}
 

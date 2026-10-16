'use client';

import { useEffect } from 'react';
import { AlertTriangle, BadgeCheck, Clock3, FileCheck2, LockKeyhole, X } from 'lucide-react';
import type { Graduate } from '../data/graduates.mock';

interface ObservationModalProps {
  graduate: Graduate;
  onClose: () => void;
}

export function ObservationModal({ graduate, onClose }: ObservationModalProps) {
  // Cierre accesible con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="observation-modal-title"
        aria-modal="true"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-sm bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-[#25384a] px-4 py-4 text-white sm:gap-4 sm:px-8 sm:py-5">
          <div className="flex gap-3">
            <div
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-[#c7783e] text-xs text-[#c7783e] sm:h-6 sm:w-6"
            >
              !
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#d8783c] sm:text-[10px]">
                Resolución de dictamen administrativo
              </p>
              <h2
                id="observation-modal-title"
                className="mt-1 text-lg font-bold leading-tight sm:text-2xl"
              >
                Expediente de Observación y Motivos de Rechazo
              </h2>
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div className="space-y-3 px-3 py-3 sm:px-5 sm:py-4">
            <div className="grid grid-cols-2 divide-x divide-[#ddd8ca] bg-[#f1eee6] sm:grid-cols-3">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Número de registro
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">
                {graduate.registrationNumber}
              </p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Código SIS
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">{graduate.sisCode}</p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Postulante titulado
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                {graduate.fullName}
              </p>
            </div>
              <div className="col-span-2 border-t border-[#ddd8ca] px-3 py-2 sm:col-span-1 sm:border-l sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Teléfono de contacto
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">{graduate.phone}</p>
              </div>
          </div>

            <div className="border border-red-200 bg-red-50 px-3 py-3 sm:px-4">
              <div className="flex gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-red-500"
                  size={16}
                />
                <div>
                  <p className="text-sm font-bold leading-tight text-red-700">
                    Causales Determinantes de Inadmisibilidad
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-red-700">
                    El grado no ha sido incorporado al padrón general debido al incumplimiento de
                    las siguientes disposiciones del Código Universitario:
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Lista detallada de causales y motivos formales
                </p>
                <span className="shrink-0 rounded bg-[#e8e4d9] px-2 py-1 text-[9px] font-bold text-slate-500">
                  1 causal
                </span>
              </div>
              <div className="rounded bg-[#f1eee6] p-2 sm:px-4 sm:py-3">
                <div className="flex gap-2 rounded bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600"
                  />
                  <p>
                    <strong className="font-bold text-slate-800">Motivo registrado: </strong>
                    {graduate.rejectionReason || 'No se especificó un motivo para este expediente.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-3 mb-3 bg-[#f1eee6] px-3 py-3 sm:mx-5 sm:px-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#ddd8ca] pb-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <BadgeCheck aria-hidden="true" size={14} />
                Atestación oficial
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Hash: <span className="text-slate-700">9A4F-2024</span>
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha de emisión de dictamen
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Clock3 aria-hidden="true" size={14} />
                {graduate.reviewDate} — 14:35 hrs (Auditoría Central)
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Responsable de dictamen pericial
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25384a] text-white">
                  <FileCheck2 aria-hidden="true" size={14} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Dra. Claudia V. Henríquez</p>
                  <p className="text-xs text-slate-600">Directora de Carrera</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#ddd8ca] bg-[#f1eee6] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="flex items-start justify-center gap-1 text-center text-[10px] text-slate-500 sm:justify-start sm:text-left">
            <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0" size={11} />
            <span>
              Resolución vinculante · Vía reconsideración ordinaria:{' '}
              <strong className="font-bold text-slate-700">15 días hábiles</strong>
            </span>
          </p>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25384a] px-7 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:w-auto"
            onClick={onClose}
            type="button"
          >
            <BadgeCheck aria-hidden="true" size={16} />
            Cerrar Dictamen
          </button>
        </div>
      </section>
    </div>
  );
}
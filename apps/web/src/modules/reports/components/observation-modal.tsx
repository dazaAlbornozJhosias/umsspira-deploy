'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="observation-modal-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-lg bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-700">
              Dictamen de expediente
            </p>
            <h2 id="observation-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              Expediente de Observación y Motivos de Rechazo
            </h2>
          </div>
          <button
            aria-label="Cerrar modal"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Titulado</p>
            <p className="mt-1 font-semibold text-slate-900">{graduate.fullName}</p>
            <p className="text-sm text-slate-500">Código SIS: {graduate.sisCode}</p>
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-800">
              Motivo de rechazo u observación
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-950">
              {graduate.rejectionReason || 'No se especificó un motivo para este expediente.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-md bg-[#1e293b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            onClick={onClose}
            type="button"
          >
            Cerrar Dictamen
          </button>
        </div>
      </section>
    </div>
  );
}
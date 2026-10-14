'use client';

import { FileUp, Loader2 } from 'lucide-react';
import { KeyboardEvent as ReactKeyboardEvent, RefObject, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { EXPORTABLE_STATUSES, REPORT_MESSAGES } from '../constants/report-messages';
import { GraduateStatus } from '../types/graduates-report.types';

export interface ExportMenuProps {
  // Estado del filtro de la lista. Sin él, el menú ofrece verificados y observados.
  status?: GraduateStatus;
  isGenerating: boolean;
  onExportPdf: (status: GraduateStatus) => void;
  // Permite devolver el foco al botón cuando se cierra la vista previa o la alerta
  buttonRef?: RefObject<HTMLButtonElement>;
}

// Botón Exportar con su menú. En computadora es un menú desplegable;
// en celular, una hoja que sube desde abajo (mock-ups 1 de escritorio y celular).
export function ExportMenu({ status, isGenerating, onExportPdf, buttonRef }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ownButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = buttonRef ?? ownButtonRef;
  const menuRef = useRef<HTMLDivElement>(null);

  // Al abrir, el foco pasa a la primera opción; Esc cierra y lo devuelve al botón
  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, triggerRef]);

  const options = status ? [status] : EXPORTABLE_STATUSES;

  const handleSelectPdf = (selectedStatus: GraduateStatus) => {
    setIsOpen(false);
    onExportPdf(selectedStatus);
  };

  // Flechas, Inicio y Fin recorren las opciones del menú
  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const targets: Record<string, number> = {
      ArrowDown: (current + 1) % items.length,
      ArrowUp: (current - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    items[targets[event.key]]?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isGenerating}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3B4D]',
          isGenerating
            ? 'cursor-not-allowed border-[#C9C1B1] bg-[#EEE9DF] text-[#2C3B4D]/60'
            : 'border-[#C9C1B1] bg-white text-[#1B2632] hover:border-[#2C3B4D]',
          isOpen && 'border-[#2C3B4D] ring-1 ring-[#2C3B4D]',
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {REPORT_MESSAGES.generating}
          </>
        ) : (
          <>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {REPORT_MESSAGES.exportButton}
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#1B2632]/45 md:bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            role="menu"
            aria-label={REPORT_MESSAGES.menuTitle}
            onKeyDown={handleMenuKeyDown}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-4 pb-6 shadow-xl',
              'md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-64 md:rounded-xl md:border md:border-[#C9C1B1] md:p-1.5 md:pb-1.5',
            )}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#C9C1B1] md:hidden" aria-hidden="true" />
            <p className="mb-3 text-base font-semibold text-[#1B2632] md:hidden">{REPORT_MESSAGES.menuTitle}</p>
            <div className="flex flex-col gap-2 md:gap-0.5">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectPdf(option)}
                  className={cn(
                    'w-full rounded-xl border border-[#2C3B4D] bg-[#EEE9DF] px-4 py-3 text-left',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2C3B4D]',
                    'md:rounded-lg md:border-transparent md:bg-transparent md:px-3 md:py-2 md:hover:bg-[#EEE9DF] md:focus-visible:bg-[#EEE9DF]',
                  )}
                >
                  <span className="block text-sm font-semibold text-[#1B2632]">
                    {status ? REPORT_MESSAGES.pdfOption : REPORT_MESSAGES.pdfOptionFor(option)}
                  </span>
                  <span className="block text-xs text-[#2C3B4D]/80">{REPORT_MESSAGES.pdfOptionDetail}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 h-11 w-full rounded-lg border border-[#C9C1B1] text-sm font-bold text-[#1B2632] md:hidden"
            >
              {REPORT_MESSAGES.cancel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

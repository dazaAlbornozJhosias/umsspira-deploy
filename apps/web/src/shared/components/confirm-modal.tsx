'use client';

import { useEffect, useId, useRef, type ComponentType, type ReactNode } from 'react';
import { XIcon } from 'lucide-react';

interface ConfirmModalProps {
  className?: string;
  open: boolean;
  icon: ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmModal({
  className = '',
  open,
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  cancelLabel = 'Cancelar',
  confirmLabel,
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const confirmingRef = useRef(confirming);

  useEffect(() => {
    onCancelRef.current = onCancel;
    confirmingRef.current = confirming;
  }, [onCancel, confirming]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (cancelRef.current && !cancelRef.current.disabled) cancelRef.current.focus();
    else dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!confirmingRef.current) onCancelRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) { e.preventDefault(); dialogRef.current.focus(); return; }
      const index = nodes.indexOf(document.activeElement as HTMLElement);
      const last = nodes.length - 1;
      if (e.shiftKey && index <= 0) {
        e.preventDefault();
        nodes[last].focus();
      } else if (!e.shiftKey && (index === -1 || index === last)) {
        e.preventDefault();
        nodes[0].focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`confirm-modal-overlay ${className}`}>
      <div aria-hidden="true" className="confirm-modal-backdrop" onClick={() => { if (!confirming) onCancel(); }} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-busy={confirming || undefined}
        className="confirm-modal-dialog"
      >
        <div className="confirm-modal-header">
          <span aria-hidden="true" className="confirm-modal-icon">
            <Icon className="icon" />
          </span>
          <div className="confirm-modal-copy">
            {eyebrow && <p className="confirm-modal-eyebrow">{eyebrow}</p>}
            <h2 id={titleId} className="confirm-modal-title">
              {title}
            </h2>
            <div id={descId} className="confirm-modal-description">
              {description}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            aria-label="Cerrar"
            className="confirm-modal-close"
          >
            <XIcon className="icon" />
          </button>
        </div>

        {children && <div className="confirm-modal-content">{children}</div>}

        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="mentor-button mentor-button-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="mentor-button confirm-modal-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CancellationSuccessProps {
  eventTitle: string;
  onReturn?: () => void;
}

export function CancellationSuccess({ eventTitle, onReturn }: CancellationSuccessProps) {
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => { resultRef.current?.focus(); }, []);

  return (
    <section className="hu4-cancellation-confirmed" role="status" tabIndex={-1} ref={resultRef}>
      <span className="hu4-cancellation-confirmed-icon" aria-hidden="true">
        <CheckCircle2 size={24} />
      </span>
      <h2>Inscripción cancelada</h2>
      <p>El cupo fue liberado y el pase QR asociado dejó de estar vigente.</p>
      <div className="hu4-cancellation-confirmed-registration" aria-label={`Inscripción seleccionada: ${eventTitle}`}>
        <span>Inscripción seleccionada</span>
        <span className="hu4-cancellation-badge">CANCELADA</span>
      </div>
      <div className="hu4-cancellation-confirmed-actions">
        <Link href="/portal/eventos">Explorar eventos</Link>
        {onReturn ? (
          <button type="button" onClick={onReturn}>Volver a mis eventos</button>
        ) : (
          <Link href="/portal/eventos/mis-eventos">Volver a mis eventos</Link>
        )}
      </div>
    </section>
  );
}

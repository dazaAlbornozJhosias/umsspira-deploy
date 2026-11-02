'use client';

import { BellRing, CircleCheck, Clock3, Inbox } from 'lucide-react';
import type { BoardMetrics } from '@/modules/applications/frontend/services/applications-board.service';

interface RequestsMetricsProps {
  metrics: BoardMetrics | null;
  isLoading: boolean;
}

const METRICS = [
  { key: 'receivedToday', label: 'Recibidas hoy', Icon: Inbox },
  { key: 'pending', label: 'Pendientes', Icon: Clock3 },
  { key: 'urgent', label: 'Urgentes (> 48h)', Icon: BellRing, urgent: true },
  { key: 'resolvedToday', label: 'Resueltas hoy', Icon: CircleCheck },
] as const;

export function RequestsMetrics({ metrics, isLoading }: RequestsMetricsProps) {
  return (
    <section aria-label="Indicadores de solicitudes" aria-busy={isLoading}>
      <p className="sr-only">
        Totales de las carreras a tu cargo. Hoy se calcula en horario de Bolivia; los filtros se
        aplican a la lista.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => {
          const { key, label, Icon } = metric;
          const urgent = 'urgent' in metric && metric.urgent;
          const value = metrics?.[key];
          return (
            <article
              key={key}
              title={
                urgent
                  ? 'Solicitudes pendientes con más de 48 horas desde su registro'
                  : 'Total de las carreras a tu cargo'
              }
              className={`rounded-md border border-oatmeal bg-white px-2.5 py-2 shadow-sm ${
                urgent ? 'border-l-[3px] border-l-truffle-trouble' : ''
              }`}
            >
              <div
                className={`flex items-center justify-between gap-2 ${
                  urgent ? 'text-truffle-trouble' : 'text-abyssal-blue/65'
                }`}
              >
                <p className={`text-[9px] uppercase tracking-wider ${urgent ? 'font-bold text-truffle-trouble' : 'font-medium'}`}>
                  {label}
                </p>
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              </div>
              <p
                aria-live="polite"
                className={`mt-0.5 text-xl font-bold tabular-nums ${
                  urgent ? 'text-truffle-trouble' : 'text-abyssal-blue'
                }`}
              >
                {value ?? (isLoading ? '…' : '—')}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

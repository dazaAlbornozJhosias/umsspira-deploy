'use client';

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/modules/applications/frontend/services/application-query';
import { StatusBadge, type RequestStatus } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import type { BoardItem, BoardStatus } from '@/modules/applications/frontend/services/applications-board.service';

export const OVERDUE_HOURS = 48;
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const STATUS_BADGE_MAP: Record<BoardStatus, RequestStatus> = {
  PENDIENTE: 'pending',
  OBSERVADA: 'observed',
  APROBADA: 'approved',
  RECHAZADA: 'rejected',
};

export function hoursSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 3_600_000));
}

// Solo una solicitud pendiente puede estar vencida (CA-04.1).
export function isOverdue(item: BoardItem, now: number = Date.now()): boolean {
  return item.status === 'PENDIENTE' && hoursSince(item.submittedAt, now) > OVERDUE_HOURS;
}

function formatSentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface RequestsTableProps {
  items: BoardItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

// Tabla de solicitudes con alerta de antigüedad y paginación (CA-04.1).
export function RequestsTable({
  items,
  total,
  page,
  pageSize,
  onPageSizeChange,
  onPageChange,
  onSelect,
}: RequestsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-oatmeal bg-white p-10 text-center">
        <p className="text-sm font-semibold text-abyssal-blue">No hay solicitudes que coincidan con los filtros.</p>
        <p className="mt-1 text-xs text-abyssal-blue/70">Prueba con otros criterios o limpia los filtros.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-oatmeal bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="bg-abyssal-blue text-white">
              {['Código', 'Egresado / Correo', 'C.I. / Expedido', 'Carrera', 'Código SIS', 'Antigüedad / Envío', 'Estado'].map(
                (header) => (
                  <th key={header} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const hours = hoursSince(item.submittedAt);
              const overdue = isOverdue(item);
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onSelect(item.id);
                  }}
                  tabIndex={0}
                  className={`cursor-pointer border-t border-oatmeal/60 transition-colors hover:bg-palladian/60 ${
                    overdue ? 'border-l-4 border-l-truffle-trouble' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-xs font-bold text-abyssal-blue">{item.code}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-abyssal-blue">{item.fullName}</p>
                    <p className="text-xs text-abyssal-blue/60">{item.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-abyssal-blue">
                    {item.ci} <span className="text-xs text-abyssal-blue/60">{item.issuedIn}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-abyssal-blue">{item.career || '—'}</td>
                  <td className="px-4 py-3 text-sm text-abyssal-blue">{item.sisCode || '—'}</td>
                  <td className="px-4 py-3">
                    {overdue && (
                      <span className="mb-1 inline-block rounded-md bg-truffle-trouble px-2 py-0.5 text-[11px] font-bold text-white">
                        Alerta &gt;48h
                      </span>
                    )}
                    <p className="text-xs text-abyssal-blue/70">
                      {hours} hrs ({formatSentDate(item.submittedAt)})
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_BADGE_MAP[item.status]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-oatmeal/60 px-4 py-3 sm:flex-row">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-xs text-abyssal-blue/70">
            Mostrando {start}-{end} de {total} solicitudes
          </p>
          <label className="flex items-center gap-2 text-xs text-abyssal-blue/70">
            Mostrar
            <select
              aria-label="Filas por página"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-oatmeal bg-palladian px-2 text-sm text-abyssal-blue outline-none focus:border-blue-fantastic"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            por página
          </label>
        </div>
        <nav aria-label="Paginación" className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            ‹ Anterior
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1)
            .map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={pageNumber === page ? 'primary' : 'secondary'}
                onClick={() => onPageChange(pageNumber)}
                aria-label={`Página ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            ))}
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            Siguiente ›
          </Button>
        </nav>
      </div>
    </div>
  );
}

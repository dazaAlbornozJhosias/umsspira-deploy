'use client';

import { Eye } from 'lucide-react';
import type { Graduate } from '../data/graduates.mock';

interface GraduatesTableProps {
  graduates: Graduate[];
  onViewReason: (graduate: Graduate) => void;
  startIndex?: number;
}

function StatusBadge({ status }: { status: Graduate['status'] }) {
  const isVerified = status === 'VERIFICADO';

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        isVerified ? 'bg-[#1e293b] text-white' : 'bg-[#dc2626] text-white'
      }`}
    >
      {status}
    </span>
  );
}

export function GraduatesTable({
  graduates,
  onViewReason,
  startIndex = 0,
}: GraduatesTableProps) {
  return (
    <>
      {/* Vista de escritorio / tablet (Altura fija h-14 y truncamiento - BUG 4) */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1550px] border-collapse text-left text-sm table-fixed">
            <thead className="bg-[#1e293b] text-xs font-bold uppercase tracking-wide text-white">
              <tr className="h-12">
                <th className="w-16 px-4 py-3 text-center">Nro</th>
                <th className="w-48 px-4 py-3">Número de registro</th>
                <th className="w-64 px-4 py-3">Nombre completo</th>
                <th className="w-32 px-4 py-3">Código SIS</th>
                <th className="w-36 px-4 py-3">Teléfono</th>
                <th className="w-56 px-4 py-3">Correo electrónico</th>
                <th className="w-36 px-4 py-3">Fecha de ingreso</th>
                <th className="w-36 px-4 py-3">Fecha de titulación</th>
                <th className="w-36 px-4 py-3">Duración de estudio</th>
                <th className="w-36 px-4 py-3">Fecha de revisión</th>
                <th className="w-36 px-4 py-3 text-center">Motivo de rechazo</th>
                <th className="w-36 px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {graduates.map((record, index) => (
                <tr
                  key={record.id}
                  className="h-14 hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap font-mono text-xs">
                    {record.registrationNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[240px]">
                    <div className="truncate" title={record.fullName}>
                      {record.fullName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.sisCode}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.phone}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                    <div className="truncate" title={record.email}>
                      {record.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.admissionDate}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.degreeDate ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.studyDuration}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {record.reviewDate}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {record.status === 'VERIFICADO' ? (
                      <span aria-label="Sin motivo de rechazo" className="text-slate-400">
                        —
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewReason(record)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        <Eye aria-hidden="true" size={15} />
                        Ver motivo
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil (Tarjetas colapsables semánticas) */}
      <div className="space-y-3 md:hidden">
        {graduates.map((record) => (
          <article
            key={record.id}
            className="rounded-lg border border-[#d8d1c3] bg-[#fffaf0] p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#e4ded2] pb-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 font-mono">
                  {record.registrationNumber}
                </p>
                <h3 className="mt-1 truncate text-xs font-bold text-slate-900" title={record.fullName}>
                  {record.fullName}
                </h3>
                <p className="mt-0.5 truncate text-[10px] text-slate-600">{record.email}</p>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-[#eee8dd] bg-white p-2.5 text-[10px]">
              <div>
                <dt className="font-semibold uppercase text-slate-500">Código SIS</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{record.sisCode}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase text-slate-500">Teléfono</dt>
                <dd className="mt-0.5 break-words text-slate-800">{record.phone}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase text-slate-500">Fecha de ingreso</dt>
                <dd className="mt-0.5 text-slate-800">{record.admissionDate}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase text-slate-500">Fecha de titulación</dt>
                <dd className="mt-0.5 text-slate-800">{record.degreeDate ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase text-slate-500">Duración de estudio</dt>
                <dd className="mt-0.5 text-slate-800">{record.studyDuration}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase text-slate-500">Fecha de revisión</dt>
                <dd className="mt-0.5 text-slate-800">{record.reviewDate}</dd>
              </div>
            </dl>

            <div className="pt-2">
              {record.status === 'VERIFICADO' ? (
                <span className="block text-center text-[10px] text-slate-400">—</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onViewReason(record)}
                  className="inline-flex min-h-7 w-full items-center justify-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <Eye aria-hidden="true" size={14} />
                  Ver motivo de rechazo
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
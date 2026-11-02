'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch, SessionError } from '@/shared/services/auth-session';
import { isSessionExpiredError, notifySessionExpired } from '@/modules/auth/frontend/services/session-expired';
import { ConnectionErrorBanner } from '@/modules/reports/components/connection-error-banner';

type SurveyReport = {
  total: number;
  trabajan: number;
  noTrabajan: number;
  porModalidad: Record<string, number>;
  porSalario: Record<string, number>;
  porInsercion: Record<string, number>;
  respuestas: Array<{ id: string; condicionLaboral: string; cargo: string | null; empresa: string | null; modalidad: string | null; fechaEnvio: string }>;
};

export function SurveyReportDashboard() {
  const [report, setReport] = useState<SurveyReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    authenticatedFetch('/api/v1/reports/surveys')
      .then(async (response) => {
        // HU-004 CA-06: un 401 es sesión caducada y abre la ventana de alerta.
        if (response.status === 401) throw new SessionError(401, 'Su sesión ha expirado');
        if (!response.ok) throw new Error('No se pudo cargar el reporte de encuestas');
        return (await response.json()).data as SurveyReport;
      })
      .then(setReport)
      .catch((reason: unknown) => {
        if (isSessionExpiredError(reason)) return notifySessionExpired();
        setError(true);
      });
  }, []);

  // HU-004 CA-09: cualquier fallo de la API o de la red muestra el banner de conexión.
  if (error) return <ConnectionErrorBanner className="mt-5" />;
  if (!report) return <p className="mt-5 text-sm text-abyssal-blue/70">Cargando respuestas...</p>;

  const groups = [['Modalidad', report.porModalidad], ['Salario mensual', report.porSalario], ['Inserción laboral', report.porInsercion]] as const;
  return <>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{[['Total respuestas', report.total], ['Trabajan', report.trabajan], ['No trabajan', report.noTrabajan]].map(([label, value]) => <div key={label} className="rounded-lg border border-oatmeal bg-palladian p-5"><p className="text-sm text-abyssal-blue/70">{label}</p><p className="mt-2 text-3xl font-semibold text-abyssal-blue">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">{groups.map(([title, values]) => <section key={title} className="rounded-lg border border-oatmeal p-5"><h3 className="font-semibold text-abyssal-blue">{title}</h3><dl className="mt-3 space-y-2 text-sm">{Object.entries(values).map(([key, value]) => <div key={key} className="flex justify-between gap-3"><dt className="text-abyssal-blue/70">{key}</dt><dd className="font-semibold text-abyssal-blue">{value}</dd></div>)}</dl></section>)}</div>
    <section className="mt-6 overflow-x-auto rounded-lg border border-oatmeal"><h3 className="border-b border-oatmeal p-5 font-semibold text-abyssal-blue">Respuestas registradas</h3><table className="min-w-full text-left text-sm"><thead className="bg-palladian text-abyssal-blue/70"><tr><th className="px-4 py-3">Condición</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Modalidad</th><th className="px-4 py-3">Envío</th></tr></thead><tbody>{report.respuestas.map((answer) => <tr key={answer.id} className="border-t border-oatmeal"><td className="px-4 py-3">{answer.condicionLaboral}</td><td className="px-4 py-3">{answer.cargo ?? 'No corresponde'}</td><td className="px-4 py-3">{answer.empresa ?? 'No corresponde'}</td><td className="px-4 py-3">{answer.modalidad ?? 'No corresponde'}</td><td className="px-4 py-3">{new Date(answer.fechaEnvio).toLocaleDateString('es-BO')}</td></tr>)}</tbody></table></section>
  </>;
}

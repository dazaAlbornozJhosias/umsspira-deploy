/**
 * HU-004 / T4.1: destino administrativo de navegación de encuestas.
 * HU-001/HU-002 implementan /surveys para titulados y HU-003 integra
 * los datos de la encuesta. Aquí NO se generan métricas inventadas.
 */
export default function EmploymentSurveyAdminPage() {
  return (
    <main className="min-w-0 p-6">
      <section
        aria-labelledby="employment-surveys-heading"
        className="rounded-xl border border-oatmeal bg-white p-5 shadow-sm sm:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-truffle-trouble">
          Seguimiento institucional
        </p>
        <h2 id="employment-surveys-heading" className="mt-2 font-display text-2xl text-abyssal-blue">
          Encuestas de Empleabilidad
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-abyssal-blue/75">
          Consulta institucional de las encuestas de empleabilidad de los titulados.
          Esta área estará disponible cuando se integre la información real de las encuestas.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-oatmeal bg-palladian p-5">
            <h3 className="font-semibold text-abyssal-blue">Reportes de encuestas</h3>
            <p className="mt-2 text-sm text-abyssal-blue/75">
              Los indicadores de las respuestas se habilitarán al integrar HU-003.
            </p>
            <p className="mt-4 text-xs font-semibold text-truffle-trouble">
              Pendiente de integración
            </p>
          </section>
          <section className="rounded-lg border border-oatmeal bg-palladian p-5">
            <h3 className="font-semibold text-abyssal-blue">Seguimiento institucional</h3>
            <p className="mt-2 text-sm text-abyssal-blue/75">
              Los resultados se mostrarán cuando existan consultas de datos verificadas.
            </p>
            <p className="mt-4 text-xs font-semibold text-truffle-trouble">
              Pendiente de integración
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

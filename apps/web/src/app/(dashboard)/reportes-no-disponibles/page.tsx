import Link from 'next/link';

/**
 * HU-004: pantalla segura para un fallo de autenticación/backend.
 * Se reescribe aquí desde middleware con estado 503. Nunca carga datos privados.
 */
export default function ReportsUnavailablePage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <section className="rounded-xl border border-oatmeal bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl text-abyssal-blue">
          Reportes Institucionales
        </h1>
        <p
          role="alert"
          className="mt-4 rounded-md border border-truffle-trouble bg-palladian px-4 py-3 text-sm text-abyssal-blue"
        >
          No se pudo conectar con el servidor. Verifique su conexión o intente más tarde
        </p>
        <p className="mt-3 text-sm text-abyssal-blue/75">
          No se muestran datos institucionales mientras no podamos verificar la sesión.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/reports"
            className="rounded-md bg-abyssal-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Reintentar conexión
          </Link>
          <Link href="/" className="rounded-md border border-oatmeal px-4 py-2 text-sm text-abyssal-blue">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
